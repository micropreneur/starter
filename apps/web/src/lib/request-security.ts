export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) {
    throw new Response('Invalid request origin.', { status: 403 })
  }
}
