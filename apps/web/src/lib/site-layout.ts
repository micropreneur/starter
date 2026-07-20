const STANDALONE_AUTH_PATHS = new Set(['/sign-in', '/sign-up'])

export function isStandaloneAuthPath(pathname: string) {
  return STANDALONE_AUTH_PATHS.has(pathname)
}
