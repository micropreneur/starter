export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) {
    throw new Response('Invalid request origin.', { status: 403 })
  }
}

export function requireSameOriginUrl(value: string, request: Request) {
  let target: URL
  try {
    target = new URL(value)
  } catch {
    throw new Response('Invalid callback URL.', { status: 400 })
  }
  if (target.origin !== new URL(request.url).origin) {
    throw new Response('Invalid callback origin.', { status: 400 })
  }
}
