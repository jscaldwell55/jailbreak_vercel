import { NextRequest } from 'next/server'

interface MockRequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  cookies?: Record<string, string>
  url?: string
}

export function createMockRequest(options: MockRequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    body,
    headers = {},
    cookies = {},
    url = 'http://localhost:3000/api/test'
  } = options

  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  })

  // Add cookies as Cookie header
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
    requestHeaders.set('Cookie', cookieString)
  }

  const request = new NextRequest(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  return request
}

export function createMockRequestWithDemoSession(
  demoSessionId: string,
  options: MockRequestOptions = {}
): NextRequest {
  return createMockRequest({
    ...options,
    cookies: {
      demo_session: demoSessionId,
      ...options.cookies,
    },
  })
}
