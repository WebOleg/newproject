// Reconciliation utilities for emerchantpay Genesis API
// Allows fetching and comparing transactions

export interface ReconcileRequest {
  uniqueId: string
  terminalToken?: string
}

export interface ReconcileResponse {
  ok: boolean
  status?: string
  uniqueId?: string
  transactionId?: string
  amount?: number
  currency?: string
  timestamp?: string
  message?: string
  technicalMessage?: string
  errorCode?: string
  errorDescription?: string
}

export type ReconcileIdentifier = string | { uniqueId?: string; transactionId?: string }

/**
 * Reconcile (retrieve) a specific transaction by unique_id or transaction_id
 * This uses the Genesis "reconcile" transaction type
 */
export async function reconcileTransaction(identifier: ReconcileIdentifier): Promise<ReconcileResponse> {
  let uniqueId: string | undefined
  let transactionId: string | undefined

  if (typeof identifier === 'string') {
    uniqueId = identifier
  } else {
    uniqueId = identifier.uniqueId
    transactionId = identifier.transactionId
  }

  if (!uniqueId && !transactionId) {
    throw new Error('reconcileTransaction requires uniqueId or transactionId')
  }

  const username = process.env.EMP_GENESIS_USERNAME
  const password = process.env.EMP_GENESIS_PASSWORD
  const terminalToken = process.env.EMP_GENESIS_TERMINAL_TOKEN
  const endpoint = process.env.EMP_GENESIS_ENDPOINT || 'https://staging.gate.emerchantpay.net'

  if (!username || !password || !terminalToken) {
    throw new Error('Genesis credentials are not configured')
  }

  try {
    // Try using genesis.js SDK first
    // @ts-ignore: no types for genesis.js
    const genesis = await import('genesis.js')
    
    if (genesis && typeof genesis.configuration === 'function') {
      genesis.configuration({
        username,
        password,
        token: terminalToken,
        environment: endpoint.includes('staging') ? 'staging' : 'production',
      })
    }

    const tx = new genesis.transaction()
    
    const payload: Record<string, string> = {
      terminal_token: terminalToken,
    }

    if (uniqueId) payload.unique_id = uniqueId
    if (transactionId) payload.transaction_id = transactionId

    let promise: Promise<any>
    if (typeof tx.reconcile === 'function') {
      promise = tx.reconcile(payload).send()
    } else if (typeof tx.request === 'function') {
      promise = tx.request('reconcile', payload).send()
    } else {
      throw new Error('genesis.js does not support reconcile')
    }

    const res = await promise
    const status = res?.status || res?.payment_response?.status
    const resUniqueId = res?.unique_id || res?.payment_response?.unique_id
    const resTransactionId = res?.transaction_id || res?.payment_response?.transaction_id
    const amount = res?.amount || res?.payment_response?.amount
    const currency = res?.currency || res?.payment_response?.currency
    const timestamp = res?.timestamp || res?.payment_response?.timestamp
    const technicalMessage = res?.technical_message || res?.payment_response?.technical_message
    const message = res?.message || res?.payment_response?.message
    const errorCode = res?.code || res?.payment_response?.code
    const errorDescription = res?.technical_message || res?.payment_response?.technical_message || res?.message

    return {
      ok: String(status || '').toLowerCase() !== 'error',
      status,
      uniqueId: resUniqueId,
      transactionId: resTransactionId,
      amount: amount ? parseFloat(amount) * 100 : undefined, // Convert to minor units
      currency,
      timestamp,
      message,
      technicalMessage,
      errorCode,
      errorDescription,
    }
  } catch (e: any) {
    console.error('[Reconcile] Error:', e.message)
    return {
      ok: false,
      message: e.message || 'Reconcile failed',
    }
  }
}

export function reconcileTransactionByTransactionId(transactionId: string): Promise<ReconcileResponse> {
  return reconcileTransaction({ transactionId })
}

/**
 * Reconcile multiple transactions by their unique_ids
 * Returns a map of uniqueId -> ReconcileResponse
 */
export async function reconcileTransactions(uniqueIds: string[]): Promise<Map<string, ReconcileResponse>> {
  const results = new Map<string, ReconcileResponse>()
  
  // Process in batches of 5 to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize)
    const promises = batch.map(async (uid) => {
      const res = await reconcileTransaction(uid)
      return { uid, res }
    })
    
    const batchResults = await Promise.all(promises)
    for (const { uid, res } of batchResults) {
      results.set(uid, res)
    }
  }
  
  return results
}

/**
 * Compare CSV records with EMP transactions
 * Returns analysis of what's missing, what succeeded, what failed
 */
export interface ReconciliationReport {
  total: number
  submitted: number
  approved: number
  pending: number
  error: number
  notSubmitted: number
  missingInEmp: string[] // transaction_ids that were submitted but not found in EMP
  details: Array<{
    csvRowIndex: number
    transactionId: string
    status: 'approved' | 'pending' | 'error' | 'not_submitted' | 'missing_in_emp'
    empStatus?: string
    message?: string
  }>
}

export async function compareWithEmp(
  records: Array<{ transactionId?: string; uniqueId?: string; status?: string }>,
): Promise<ReconciliationReport> {
  const report: ReconciliationReport = {
    total: records.length,
    submitted: 0,
    approved: 0,
    pending: 0,
    error: 0,
    notSubmitted: 0,
    missingInEmp: [],
    details: [],
  }

  // Collect all unique_ids to reconcile
  const uniqueIds = records
    .filter((r) => r.uniqueId && r.status !== 'pending')
    .map((r) => r.uniqueId as string)

  if (uniqueIds.length === 0) {
    // None submitted yet
    report.notSubmitted = records.length
    records.forEach((r, idx) => {
      report.details.push({
        csvRowIndex: idx,
        transactionId: r.transactionId || `row-${idx}`,
        status: 'not_submitted',
      })
    })
    return report
  }

  // Reconcile all submitted transactions
  const empResults = await reconcileTransactions(uniqueIds)

  // Analyze results
  records.forEach((record, idx) => {
    const { transactionId, uniqueId, status } = record

    if (!uniqueId || status === 'pending') {
      report.notSubmitted++
      report.details.push({
        csvRowIndex: idx,
        transactionId: transactionId || `row-${idx}`,
        status: 'not_submitted',
      })
      return
    }

    report.submitted++
    const empRes = empResults.get(uniqueId)

    if (!empRes || !empRes.ok) {
      // Not found in EMP
      report.missingInEmp.push(transactionId || `row-${idx}`)
      report.details.push({
        csvRowIndex: idx,
        transactionId: transactionId || `row-${idx}`,
        status: 'missing_in_emp',
        message: empRes?.message || 'Not found in EMP',
      })
      return
    }

    // Found in EMP - check status
    const empStatus = empRes.status?.toLowerCase()
    if (empStatus === 'approved' || empStatus === 'success') {
      report.approved++
      report.details.push({
        csvRowIndex: idx,
        transactionId: transactionId || `row-${idx}`,
        status: 'approved',
        empStatus: empRes.status,
      })
    } else if (empStatus === 'error' || empStatus === 'declined') {
      report.error++
      report.details.push({
        csvRowIndex: idx,
        transactionId: transactionId || `row-${idx}`,
        status: 'error',
        empStatus: empRes.status,
        message: empRes.message || empRes.technicalMessage,
      })
    } else {
      report.pending++
      report.details.push({
        csvRowIndex: idx,
        transactionId: transactionId || `row-${idx}`,
        status: 'pending',
        empStatus: empRes.status,
      })
    }
  })

  return report
}

