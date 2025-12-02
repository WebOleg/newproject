import { NextResponse } from 'next/server'

export async function GET() {
  const username = process.env.EMP_GENESIS_USERNAME
  const password = process.env.EMP_GENESIS_PASSWORD
  const terminalToken = process.env.EMP_GENESIS_TERMINAL_TOKEN
  const endpoint = process.env.EMP_GENESIS_ENDPOINT || 'https://staging.gate.emerchantpay.net'

  if (!username || !password || !terminalToken) {
    return NextResponse.json({ error: 'Credentials not configured' }, { status: 500 })
  }

  // Build endpoint URL
  const fullEndpoint = `${endpoint}/process/${terminalToken}`

  // Try a simple test request
  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'text/xml',
        'authorization': `Basic ${auth}`,
      },
      body: '<invalid>test</invalid>', // Intentionally invalid to just test auth
    })

    const text = await response.text()

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      endpoint: fullEndpoint,
      responsePreview: text.substring(0, 500),
      message: response.status === 401
        ? 'HTTP 401 - Most likely IP not whitelisted at EmerchantPay'
        : response.status === 400
        ? 'Auth worked! (400 is expected for invalid XML)'
        : 'Check response'
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
