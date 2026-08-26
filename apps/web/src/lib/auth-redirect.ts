const DEFAULT_AUTH_CALLBACK_PATH = '/app'

export function safeAuthCallbackPath(value: string | undefined): string {
  if (!value || value.length > 2048 || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_AUTH_CALLBACK_PATH
  }
  return value
}

export function verificationCallbackUrl(requestUrl: string, callbackPath: string | undefined) {
  const callbackUrl = new URL('/sign-in', requestUrl)
  callbackUrl.searchParams.set('callbackUrl', safeAuthCallbackPath(callbackPath))
  return callbackUrl.toString()
}
