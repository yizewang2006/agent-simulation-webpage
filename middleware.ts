const USERNAME = 'emory'

function unauthorized(message = 'Authentication required') {
  return new Response(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Private Agent Simulation", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  })
}

export default function middleware(request: Request) {
  const password = process.env.SITE_PASSWORD

  // Fail closed so a missing Vercel secret never makes the site public.
  if (!password) {
    return new Response('Site authentication is not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Basic ')) {
    return unauthorized()
  }

  try {
    const credentials = atob(authorization.slice(6))
    const separator = credentials.indexOf(':')
    const username = credentials.slice(0, separator)
    const suppliedPassword = credentials.slice(separator + 1)

    if (separator === -1 || username !== USERNAME || suppliedPassword !== password) {
      return unauthorized('Incorrect username or password')
    }
  } catch {
    return unauthorized('Invalid authentication credentials')
  }

  // Returning no response lets Vercel continue to the requested page or asset.
}

export const config = {
  matcher: '/:path*',
}
