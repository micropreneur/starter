export * from './adapters/local'
export * from './adapters/resend'
export * from './port'
export * from './templates'

export type EmailProvider = 'local' | 'resend'

export function resolveEmailProvider(value: string | undefined, isLocal: boolean): EmailProvider {
  const provider = value?.trim().toLowerCase()
  if (!provider) {
    if (isLocal) return 'local'
    throw new Error('EMAIL_PROVIDER must be set to "resend" outside local development.')
  }
  if (provider === 'local') {
    if (!isLocal) throw new Error('The local email adapter is disabled outside local development.')
    return 'local'
  }
  if (provider === 'resend') return 'resend'
  throw new Error(`Unsupported EMAIL_PROVIDER: ${value}`)
}
