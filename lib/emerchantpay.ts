import crypto from 'crypto'

export type DynamicDescriptorParams = {
  merchantName?: string // max 25 chars - Allows to dynamically override the charge descriptor
  merchantCity?: string // max 13 chars
  subMerchantId?: string // max 15 chars
  merchantCountry?: string // max 3 chars
  merchantState?: string // max 3 chars
  merchantZipCode?: string // max 10 chars
  merchantAddress?: string // max 48 chars
  merchantUrl?: string // max 60 chars
  merchantPhone?: string // max 16 chars
  merchantServiceCity?: string // max 13 chars
  merchantServiceCountry?: string // max 3 chars
  merchantServiceState?: string // max 3 chars
  merchantServiceZipCode?: string // max 10 chars
  merchantServicePhone?: string // max 16 chars
  merchantGeoCoordinates?: string // max 20 chars
  merchantServiceGeoCoordinates?: string // max 20 chars
}

export type SddSaleRequest = {
  transactionId: string
  amountMinor: number
  currency: string
  usage?: string
  firstName?: string
  lastName?: string
  address1?: string
  zipCode?: string
  city?: string
  country?: string
  customerEmail?: string
  iban: string
  remoteIp?: string
  dynamicDescriptorParams?: DynamicDescriptorParams
  // For CSV mapping: use product_descriptor or vzweck1 to populate dynamicDescriptorParams.merchantName
  // Custom return URLs (override defaults from env vars)
  customReturnUrls?: {
    baseUrl?: string // e.g., "https://bestwin.team"
    successPath?: string // default: "/success"
    failurePath?: string // default: "/failure"
    pendingPath?: string // default: "/pending"
    cancelPath?: string // default: "/cancel"
  }
}

export type SddSaleResponse = {
  ok: boolean
  status?: string
  uniqueId?: string
  redirectUrl?: string
  message?: string
  technicalMessage?: string
}

function getConfig() {
  const endpointEnv = process.env.EMP_GENESIS_ENDPOINT // e.g. https://staging.gate.emerchantpay.net or .../process
  const terminalToken = process.env.EMP_GENESIS_TERMINAL_TOKEN // required
  const username = process.env.EMP_GENESIS_USERNAME
  const password = process.env.EMP_GENESIS_PASSWORD
  if (!endpointEnv || !terminalToken || !username || !password) {
    throw new Error('Genesis credentials are not configured')
  }
  const endpoint = buildProcessUrl(sanitizeBaseEndpoint(endpointEnv), terminalToken)
  return { endpoint, username, password, terminalToken }
}

function buildProcessUrl(base: string, token: string): string {
  // Normalize base and append /process/{token}
  let url = base.replace(/\/$/, '')
  const hasProcess = /\/process(\/|$)/.test(url)
  if (!hasProcess) url = `${url}/process`
  if (!url.endsWith(`/process/${token}`)) {
    // Strip any trailing slash after /process
    url = url.replace(/\/process\/$/, '/process')
    // If a different token is present, replace it
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
  // Remove credentials if someone put user:pass@ in env
  try {
    const u = new URL(s)
    u.username = ''
    u.password = ''
    // drop search/hash if present
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

export function buildSddSaleXml(req: SddSaleRequest): string {
  // 🔍 DEBUG: Show what data we're building XML from
  console.log('=== [DEBUG 5] Building XML from Request ===', {
    transactionId: req.transactionId,
    firstName: req.firstName,
    lastName: req.lastName,
    iban: maskIban(req.iban),
    address1: req.address1,
    city: req.city,
    country: req.country,
    amount: req.amountMinor,
    currency: req.currency,
  })

  const notificationUrl = process.env.EMP_NOTIFICATION_URL || ''

  // Determine return URL base and paths (custom or default)
  let returnUrlBase: string
  let successPath: string
  let failurePath: string
  let pendingPath: string
  let cancelPath: string

  if (req.customReturnUrls?.baseUrl) {
    // Use custom URLs (for BestWin, etc.)
    returnUrlBase = req.customReturnUrls.baseUrl.replace(/\/$/, '') // Remove trailing slash
    successPath = req.customReturnUrls.successPath || '/success'
    failurePath = req.customReturnUrls.failurePath || '/failure'
    pendingPath = req.customReturnUrls.pendingPath || '/pending'
    cancelPath = req.customReturnUrls.cancelPath || '/cancel'
  } else {
    // Use default from env
    returnUrlBase = process.env.EMP_RETURN_BASE_URL || ''
    successPath = '/success'
    failurePath = '/failure'
    pendingPath = '/pending'
    cancelPath = '/cancel'
  }

  const ret = (p: string) => (returnUrlBase ? `${returnUrlBase}${p}` : '')

  // Build dynamic descriptor params XML
  const dynamicDescriptorXml: string[] = []
  if (req.dynamicDescriptorParams) {
    const d = req.dynamicDescriptorParams
    if (d.merchantName || d.merchantCity || d.subMerchantId || d.merchantCountry || d.merchantState ||
      d.merchantZipCode || d.merchantAddress || d.merchantUrl || d.merchantPhone || d.merchantServiceCity ||
      d.merchantServiceCountry || d.merchantServiceState || d.merchantServiceZipCode || d.merchantServicePhone ||
      d.merchantGeoCoordinates || d.merchantServiceGeoCoordinates) {
      dynamicDescriptorXml.push('<dynamic_descriptor_params>')
      if (d.merchantName) dynamicDescriptorXml.push(`<merchant_name>${xmlEscape(d.merchantName.substring(0, 25))}</merchant_name>`)
      if (d.merchantCity) dynamicDescriptorXml.push(`<merchant_city>${xmlEscape(d.merchantCity.substring(0, 13))}</merchant_city>`)
      if (d.subMerchantId) dynamicDescriptorXml.push(`<sub_merchant_id>${xmlEscape(d.subMerchantId.substring(0, 15))}</sub_merchant_id>`)
      if (d.merchantCountry) dynamicDescriptorXml.push(`<merchant_country>${xmlEscape(d.merchantCountry.substring(0, 3))}</merchant_country>`)
      if (d.merchantState) dynamicDescriptorXml.push(`<merchant_state>${xmlEscape(d.merchantState.substring(0, 3))}</merchant_state>`)
      if (d.merchantZipCode) dynamicDescriptorXml.push(`<merchant_zip_code>${xmlEscape(d.merchantZipCode.substring(0, 10))}</merchant_zip_code>`)
      if (d.merchantAddress) dynamicDescriptorXml.push(`<merchant_address>${xmlEscape(d.merchantAddress.substring(0, 48))}</merchant_address>`)
      if (d.merchantUrl) dynamicDescriptorXml.push(`<merchant_url>${xmlEscape(d.merchantUrl.substring(0, 60))}</merchant_url>`)
      if (d.merchantPhone) dynamicDescriptorXml.push(`<merchant_phone>${xmlEscape(d.merchantPhone.substring(0, 16))}</merchant_phone>`)
      if (d.merchantServiceCity) dynamicDescriptorXml.push(`<merchant_service_city>${xmlEscape(d.merchantServiceCity.substring(0, 13))}</merchant_service_city>`)
      if (d.merchantServiceCountry) dynamicDescriptorXml.push(`<merchant_service_country>${xmlEscape(d.merchantServiceCountry.substring(0, 3))}</merchant_service_country>`)
      if (d.merchantServiceState) dynamicDescriptorXml.push(`<merchant_service_state>${xmlEscape(d.merchantServiceState.substring(0, 3))}</merchant_service_state>`)
      if (d.merchantServiceZipCode) dynamicDescriptorXml.push(`<merchant_service_zip_code>${xmlEscape(d.merchantServiceZipCode.substring(0, 10))}</merchant_service_zip_code>`)
      if (d.merchantServicePhone) dynamicDescriptorXml.push(`<merchant_service_phone>${xmlEscape(d.merchantServicePhone.substring(0, 16))}</merchant_service_phone>`)
      if (d.merchantGeoCoordinates) dynamicDescriptorXml.push(`<merchant_geo_coordinates>${xmlEscape(d.merchantGeoCoordinates.substring(0, 20))}</merchant_geo_coordinates>`)
      if (d.merchantServiceGeoCoordinates) dynamicDescriptorXml.push(`<merchant_service_geo_coordinates>${xmlEscape(d.merchantServiceGeoCoordinates.substring(0, 20))}</merchant_service_geo_coordinates>`)
      dynamicDescriptorXml.push('</dynamic_descriptor_params>')
    }
  }

  const xml = [
    '<payment_transaction>',
    '<transaction_type>sdd_sale</transaction_type>',
    `<transaction_id>${xmlEscape(req.transactionId)}</transaction_id>`,
    notificationUrl ? `<notification_url>${xmlEscape(notificationUrl)}</notification_url>` : '',
    returnUrlBase ? `<return_success_url>${xmlEscape(ret(successPath))}</return_success_url>` : '',
    returnUrlBase ? `<return_failure_url>${xmlEscape(ret(failurePath))}</return_failure_url>` : '',
    returnUrlBase ? `<return_pending_url>${xmlEscape(ret(pendingPath))}</return_pending_url>` : '',
    returnUrlBase ? `<return_cancel_url>${xmlEscape(ret(cancelPath))}</return_cancel_url>` : '',
    req.usage ? `<usage>${xmlEscape(req.usage)}</usage>` : '',
    req.remoteIp ? `<remote_ip>${xmlEscape(req.remoteIp)}</remote_ip>` : '',
    `<amount>${req.amountMinor}</amount>`,
    `<currency>${xmlEscape(req.currency)}</currency>`,
    '<billing_address>',
    req.firstName ? `<first_name>${xmlEscape(req.firstName)}</first_name>` : '',
    req.lastName ? `<last_name>${xmlEscape(req.lastName)}</last_name>` : '',
    req.address1 ? `<address1>${xmlEscape(req.address1)}</address1>` : '',
    req.zipCode ? `<zip_code>${xmlEscape(req.zipCode)}</zip_code>` : '',
    req.city ? `<city>${xmlEscape(req.city)}</city>` : '',
    req.country ? `<country>${xmlEscape(req.country)}</country>` : '',
    '</billing_address>',
    req.customerEmail ? `<customer_email>${xmlEscape(req.customerEmail)}</customer_email>` : '',
    `<iban>${xmlEscape(req.iban)}</iban>`,
    ...dynamicDescriptorXml,
    '</payment_transaction>',
  ].filter(Boolean).join('')

  // 🔍 DEBUG: Show the final XML (with sensitive data masked)
  const xmlPreview = xml.replace(/<iban>([^<]+)<\/iban>/, (_match: string, iban: string) => {
    const masked = iban.slice(0, 4) + '****' + iban.slice(-4)
    return `<iban>${masked}</iban>`
  })
  console.log('=== [DEBUG 6] Final XML Being Sent ===')
  console.log(xmlPreview)

  return xml
}

export async function submitSddSale(req: SddSaleRequest): Promise<SddSaleResponse> {
  // Prefer SDK if installed
  try {
    const { submitSddSaleSdk } = await import('@/lib/emerchantpay-sdk')
    return await submitSddSaleSdk(req)
  } catch { }
  const { endpoint, username, password } = getConfig()
  const xml = buildSddSaleXml(req)
  const auth = Buffer.from(`${username}:${password}`).toString('base64')
  try {
    console.info('[EMP] submit sdd_sale', {
      endpoint,
      transactionId: req.transactionId,
      amountMinor: req.amountMinor,
      currency: req.currency,
      firstName: req.firstName,
      lastName: req.lastName,
      address: req.address1,
      iban: maskIban(req.iban),
    })
    // Note: The actual XML is already logged in buildSddSaleXml with DEBUG 6
    // Uncomment below if you need to see it again here:
    // console.info('[EMP] Raw XML Request:\n', xml)
  } catch { }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'text/xml',
      'authorization': `Basic ${auth}`,
      'accept': 'text/xml, application/xml;q=0.9, */*;q=0.8',
    },
    body: xml,
    // Next: keepalive short timeout may be necessary in production
  })
  const text = await res.text()

  try {
    console.info('[EMP] Raw XML Response:\n', text)
  } catch { }

  // Minimal XML parsing to extract a few fields
  const pick = (tag: string) => {
    const m = text.match(new RegExp(`<${tag}>([\s\S]*?)</${tag}>`))
    return m?.[1] || ''
  }
  const status = pick('status') || (res.ok ? 'approved' : 'error')
  const uniqueId = pick('unique_id')
  const redirectUrl = pick('redirect_url')
  const technicalMessage = pick('technical_message')
  const message = pick('message') || (!res.ok ? `HTTP ${res.status}` : '')
  try {
    console.info('[EMP] response sdd_sale', {
      httpStatus: res.status,
      ok: res.ok,
      status,
      uniqueId,
      hasRedirect: Boolean(redirectUrl),
      redirectUrl,
      message,
      technicalMessage,
    })
  } catch { }
  return { ok: res.ok, status, uniqueId, redirectUrl, message, technicalMessage }
}

export function maskIban(iban: string): string {
  const clean = iban.replace(/\s+/g, '')
  if (clean.length <= 8) return '****'
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`
}

export function verifyNotificationSignature(uniqueId: string, signature: string): boolean {
  const apiPassword = process.env.EMP_GENESIS_PASSWORD || ''
  if (!uniqueId || !apiPassword) return false
  const h = crypto.createHash('sha1')
  h.update(`${uniqueId}${apiPassword}`)
  const expected = h.digest('hex')
  return expected.toLowerCase() === signature.toLowerCase()
}

/**
 * Helper function to create dynamic descriptor params from CSV fields
 * Maps product_descriptor or vzweck1 fields to merchantName
 * @param productDescriptor - Value from CSV field "product_descriptor" (e.g., "Grand Luck Service")
 * @param vzweck1 - Value from CSV field "vzweck1" (e.g., "Monatsbeitrag 12-2025 BestWinCall KD: 76013213 Hotline 0800 - 1557722")
 * @returns DynamicDescriptorParams object ready to use in SddSaleRequest
 */
export function createDynamicDescriptorFromCsv(
  productDescriptor?: string,
  vzweck1?: string
): DynamicDescriptorParams | undefined {
  const descriptor = productDescriptor || vzweck1
  if (!descriptor) return undefined

  return {
    merchantName: descriptor.substring(0, 25), // Truncate to max 25 chars as per API spec
  }
}

/**
 * Helper function to create full dynamic descriptor params with all fields
 * Use this when you need to set multiple descriptor fields beyond just merchantName
 */
export function createDynamicDescriptor(params: {
  merchantName?: string
  merchantCity?: string
  merchantPhone?: string
  merchantUrl?: string
  // Add other fields as needed
}): DynamicDescriptorParams {
  return {
    merchantName: params.merchantName?.substring(0, 25),
    merchantCity: params.merchantCity?.substring(0, 13),
    merchantPhone: params.merchantPhone?.substring(0, 16),
    merchantUrl: params.merchantUrl?.substring(0, 60),
  }
}


