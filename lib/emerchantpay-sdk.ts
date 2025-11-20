// Thin wrapper around the official genesis.js SDK with graceful fallback errors
// Runtime: nodejs only

import type { SddSaleRequest, SddSaleResponse } from '@/lib/emerchantpay'

function toMajorAmount(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2)
}

export async function submitSddSaleSdk(req: SddSaleRequest): Promise<SddSaleResponse> {
  const username = process.env.EMP_GENESIS_USERNAME
  const password = process.env.EMP_GENESIS_PASSWORD
  const terminalToken = process.env.EMP_GENESIS_TERMINAL_TOKEN
  const endpoint = process.env.EMP_GENESIS_ENDPOINT || 'https://staging.gate.emerchantpay.net'
  if (!username || !password || !terminalToken) {
    throw new Error('Genesis SDK credentials are not configured')
  }

  // Dynamically import to avoid bundling in edge runtimes
  let genesis: any
  try {
    // @ts-ignore: no types for genesis.js
    genesis = await import('genesis.js')
  } catch (e: any) {
    throw new Error('genesis.js not installed. Please run: pnpm add genesis.js')
  }

  try {
    if (genesis && typeof genesis.configuration === 'function') {
      genesis.configuration({
        username,
        password,
        token: terminalToken,
        environment: endpoint.includes('staging') ? 'staging' : 'production',
      })
    }
  } catch {}

  const tx = new genesis.transaction()

  const payload: any = {
    transaction_id: req.transactionId,
    remote_ip: req.remoteIp,
    amount: toMajorAmount(req.amountMinor),
    currency: req.currency,
    usage: req.usage,
    customer_email: req.customerEmail,
    billing_address: {
      first_name: req.firstName,
      last_name: req.lastName,
      address1: req.address1,
      zip_code: req.zipCode,
      city: req.city,
      country: req.country,
    },
    iban: req.iban,
    terminal_token: terminalToken,
  }

  let promise: Promise<any>
  if (typeof tx.sdd_sale === 'function') {
    promise = tx.sdd_sale(payload).send()
  } else if (typeof tx.request === 'function') {
    promise = tx.request('sdd_sale', payload).send()
  } else {
    throw new Error('genesis.js transaction does not support sdd_sale in this version')
  }

  const res = await promise
  const status = res?.status || res?.payment_response?.status
  const uniqueId = res?.unique_id || res?.payment_response?.unique_id
  const redirectUrl = res?.redirect_url || res?.payment_response?.redirect_url
  const technicalMessage = res?.technical_message || res?.payment_response?.technical_message
  const message = res?.message || res?.payment_response?.message

  return {
    ok: String(status || '').toLowerCase() !== 'error',
    status,
    uniqueId,
    redirectUrl,
    message,
    technicalMessage,
  }
}


