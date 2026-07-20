import { useEffect, useState } from 'react'

const navigationEvent = 'micropreneur-docs:navigate'

export function getPathname() {
  return window.location.pathname.replace(/\/$/, '') || '/'
}

export function navigateTo(path: string) {
  const nextPath = path.replace(/\/$/, '') || '/'
  if (nextPath === getPathname()) return

  window.history.pushState(null, '', nextPath)
  window.dispatchEvent(new Event(navigationEvent))
  window.scrollTo({ top: 0 })
}

export function usePathname() {
  const [pathname, setPathname] = useState(getPathname)

  useEffect(() => {
    const update = () => setPathname(getPathname())
    window.addEventListener('popstate', update)
    window.addEventListener(navigationEvent, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(navigationEvent, update)
    }
  }, [])

  return pathname
}
