import { NextRequest, NextResponse } from 'next/server'

// Routes that belong to the EMP admin app
const EMP_PREFIX = '/emp'
const LOGIN_PATH = '/emp/login'

function isEmpHost(hostname: string): boolean {
  return hostname.startsWith('emp.') || hostname === 'emp.melinux.net'
}

async function verifySessionCookie(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get('emp_session')?.value
  if (!cookie) return false
  const secret = process.env.EMP_SESSION_SECRET || 'dev-secret'
  try {
    const [username, ts, sig] = cookie.split('.')
    if (!username || !ts || !sig) return false
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const data = `${username}.${ts}`
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))
    const expected = btoa(String.fromCharCode(...new Uint8Array(signature)))
    // Optional: expire after 24h
    const isExpired = Date.now() - Number(ts) > 24 * 60 * 60 * 1000
    return !isExpired && expected === sig
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const hostname = req.headers.get('host') || ''
  const path = url.pathname

  // Determine if request targets EMP UI or EMP API
  const onEmpHost = isEmpHost(hostname)
  const targetsEmpApi = path.startsWith('/api/emp') || (onEmpHost && path.startsWith('/api'))
  const targetsEmpUi = path.startsWith(EMP_PREFIX) || (onEmpHost && !path.startsWith('/api'))

  // Allow login page, return URLs, and login/logout APIs without session
  const publicEmpPaths = [LOGIN_PATH, '/emp/success', '/emp/failure', '/emp/pending', '/emp/cancel']
  const isPublicUi = publicEmpPaths.includes(path) || (onEmpHost && publicEmpPaths.includes(`/emp${path}`))
  const isAuthApi = path.startsWith('/api/emp/auth/') || (onEmpHost && path.startsWith('/api/emp/auth/'))

  if (!isPublicUi && !isAuthApi && (targetsEmpApi || targetsEmpUi)) {
    const ok = await verifySessionCookie(req)
    if (!ok) {
      if (targetsEmpUi) {
        // redirect to login for UI
        url.pathname = LOGIN_PATH
        return NextResponse.redirect(url)
      }
      // For API, return 401 JSON
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
  }

  // If on emp subdomain in production, map routes appropriately
  if (onEmpHost) {
    // Map API calls on emp host to /api/emp/*
    if (path.startsWith('/api') && !path.startsWith('/api/emp')) {
      url.pathname = `/api/emp${path.slice(4) || ''}`
      return NextResponse.rewrite(url)
    }

    // Map UI routes on emp host to /emp/*
    if (!path.startsWith(EMP_PREFIX) && !path.startsWith('/api')) {
      url.pathname = `${EMP_PREFIX}${path}`
      return NextResponse.rewrite(url)
    }
  }

  // In local/dev environments, access EMP as /emp/<route>
  const response = NextResponse.next()
  response.headers.set('x-pathname', path)
  return response
}

// Match all paths so we can check host header and protect EMP routes.
export const config = {
  matcher: [
    '/((?!_next/|_vercel|.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)).*)',
  ],
}


