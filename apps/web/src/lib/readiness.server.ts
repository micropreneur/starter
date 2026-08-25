import type { WebEnv } from '../env'

type AdapterState = 'configured' | 'unconfigured'
type StripeMode = 'live' | 'test' | 'unconfigured' | 'unknown'

export async function handleReadinessRequest(
  request: Request,
  env: WebEnv,
): Promise<Response | undefined> {
  const url = new URL(request.url)
  if (url.pathname !== '/api/readiness') return undefined
  if (request.method !== 'GET') {
    return new Response('Method not allowed.', { headers: { Allow: 'GET' }, status: 405 })
  }

  let migrationsApplied = 0
  let databaseConnected = false
  try {
    const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM d1_migrations').first<{
      count: number
    }>()
    migrationsApplied = Number(row?.count ?? 0)
    databaseConnected = true
  } catch {
    databaseConnected = false
  }

  const authConfigured = Boolean(
    env.AUTH_PROVIDER === 'betterauth' && env.BETTER_AUTH_SECRET && env.BETTER_AUTH_URL,
  )
  const emailConfigured = Boolean(
    env.EMAIL_PROVIDER === 'resend' && env.EMAIL_FROM && env.RESEND_API_KEY,
  )
  const turnstileConfigured = Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY)
  const stripeMode = resolveStripeMode(env.STRIPE_SECRET_KEY)
  const ready =
    databaseConnected &&
    migrationsApplied > 0 &&
    authConfigured &&
    emailConfigured &&
    turnstileConfigured &&
    stripeMode === 'test'

  return Response.json(
    {
      adapters: {
        auth: state(authConfigured),
        email: state(emailConfigured),
        stripeMode,
        turnstile: state(turnstileConfigured),
      },
      database: { connected: databaseConnected, migrationsApplied },
      status: ready ? 'ready' : 'degraded',
    },
    {
      headers: { 'Cache-Control': 'no-store' },
      status: ready ? 200 : 503,
    },
  )
}

function resolveStripeMode(secret: string | undefined): StripeMode {
  if (!secret) return 'unconfigured'
  if (secret.startsWith('sk_test_') || secret.startsWith('rk_test_')) return 'test'
  if (secret.startsWith('sk_live_') || secret.startsWith('rk_live_')) return 'live'
  return 'unknown'
}

function state(configured: boolean): AdapterState {
  return configured ? 'configured' : 'unconfigured'
}
