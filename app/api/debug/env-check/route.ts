import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasUsername: !!process.env.EMP_GENESIS_USERNAME,
    usernamePrefix: process.env.EMP_GENESIS_USERNAME?.substring(0, 8),
    hasPassword: !!process.env.EMP_GENESIS_PASSWORD,
    passwordPrefix: process.env.EMP_GENESIS_PASSWORD?.substring(0, 8),
    hasToken: !!process.env.EMP_GENESIS_TERMINAL_TOKEN,
    tokenPrefix: process.env.EMP_GENESIS_TERMINAL_TOKEN?.substring(0, 8),
    endpoint: process.env.EMP_GENESIS_ENDPOINT,
    nodeEnv: process.env.NODE_ENV,
  })
}
