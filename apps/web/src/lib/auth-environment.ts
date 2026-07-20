export function isLocalAuthEnvironment(
  baseUrl: string | undefined,
  developmentBuild: boolean,
): boolean {
  if (!developmentBuild) return false
  if (!baseUrl) return true
  try {
    const { hostname } = new URL(baseUrl)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  } catch {
    return false
  }
}

export function resolveBetterAuthBaseUrl(
  baseUrl: string | undefined,
  developmentBuild: boolean,
): string {
  const candidate = baseUrl?.trim()
  if (!candidate) {
    if (developmentBuild) return 'http://localhost:3000'
    throw new Error(
      'BETTER_AUTH_URL is required outside local development. Set it to the public HTTPS origin of this Worker.',
    )
  }

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    throw new Error('BETTER_AUTH_URL must be an absolute HTTP or HTTPS URL.')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('BETTER_AUTH_URL must be an absolute HTTP or HTTPS URL.')
  }
  return candidate.replace(/\/$/, '')
}
