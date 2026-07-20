import type { RealtimeRoom } from './durable-objects/realtime-room'

export interface WebEnv {
  AUTH_PROVIDER?: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  EMAIL_FROM?: string
  EMAIL_PROVIDER?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  RESEND_API_KEY?: string
  REALTIME_ENABLED?: string
  STRIPE_PRICE_ID?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  DB: D1Database
  REALTIME_ROOM: DurableObjectNamespace<RealtimeRoom>
}
