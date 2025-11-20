import crypto from 'crypto'

export type VoidTransactionRequest = {
  transactionId: string // Your transaction ID
  referenceId: string // unique_id from the original transaction
  usage?: string
  remoteIp?: string
}

export type VoidTransactionResponse = {
  ok: boolean
  status?: string
  uniqueId?: string
  message?: string
  technicalMessage?: string
}

function getConfig() {
  const endpointEnv = process.env.EMP_GENESIS_ENDPOINT
  const terminalToken = process.env.EMP_GENESIS_TERMINAL_TOKEN
  const username = process.env.EMP_GENESIS_USERNAME
  const password = process.env.EMP_GENESIS_PASSWORD
  if (!endpointEnv || !terminalToken || !username || !password) {
    throw new Error('Genesis credentials are not configured')
  }
  const endpoint = buildProcessUrl(sanitizeBaseEndpoint(endpointEnv), terminalToken)
  return { endpoint, username, password, terminalToken }
}

function buildProcessUrl(base: string, token: string): string {
  let url = base.replace(/\/$/, '')
  const hasProcess = /\/process(\/|$)/.test(url)
  if (!hasProcess) url = `${url}/process`
  if (!url.endsWith(`/process/${token}`)) {
    url = url.replace(/\/process\/$/, '/process')
    url = url.replace(/\/process\/[A-Za-z0-9_-]+$/, '/process')
    url = `${url}/${token}`
  }
  return url
}

function sanitizeBaseEndpoint(raw: string): string {
  let s = String(raw || '').trim()
  if (!/^https?:\/\//i.test(s)) {
    s = 'https://' + s.replace(/^\/\//, '')
  }
  try {
    const u = new URL(s)
    u.username = ''
    u.password = ''
    u.search = ''
    u.hash = ''
    return u.toString().replace(/\/$/, '')
  } catch {
    return s
  }
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildVoidXml(req: VoidTransactionRequest): string {
  return [
    '<payment_transaction>',
    '<transaction_type>void</transaction_type>',
    `<transaction_id>${xmlEscape(req.transactionId)}</transaction_id>`,
    req.usage ? `<usage>${xmlEscape(req.usage)}</usage>` : '',
    req.remoteIp ? `<remote_ip>${xmlEscape(req.remoteIp)}</remote_ip>` : '',
    `<reference_id>${xmlEscape(req.referenceId)}</reference_id>`,
    '</payment_transaction>',
  ].filter(Boolean).join('')
}

export async function voidTransaction(req: VoidTransactionRequest): Promise<VoidTransactionResponse> {
  const { endpoint, username, password } = getConfig()
  const xml = buildVoidXml(req)
  const auth = Buffer.from(`${username}:${password}`).toString('base64')
  
  try {
    console.info('[EMP Void] Voiding transaction', {
      endpoint,
      transactionId: req.transactionId,
      referenceId: req.referenceId,
    })
  } catch {}
  
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'text/xml',
      'authorization': `Basic ${auth}`,
      'accept': 'text/xml, application/xml;q=0.9, */*;q=0.8',
    },
    body: xml,
  })
  
  const text = await res.text()
  
  // Minimal XML parsing
  const pick = (tag: string) => {
    const m = text.match(new RegExp(`<${tag}>([\s\S]*?)</${tag}>`))
    return m?.[1] || ''
  }
  
  const status = pick('status') || (res.ok ? 'approved' : 'error')
  const uniqueId = pick('unique_id')
  const technicalMessage = pick('technical_message')
  const message = pick('message') || (!res.ok ? `HTTP ${res.status}` : '')
  
  try {
    console.info('[EMP Void] Response', {
      httpStatus: res.status,
      ok: res.ok,
      status,
      uniqueId,
      message,
      technicalMessage,
    })
  } catch {}
  
  return { ok: res.ok, status, uniqueId, message, technicalMessage }
}


