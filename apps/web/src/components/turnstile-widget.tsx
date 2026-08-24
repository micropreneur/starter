import { useEffect, useRef } from 'react'

import type { TurnstileAction } from '../lib/turnstile.server'

interface TurnstileApi {
  remove(widgetId: string): void
  render(
    container: HTMLElement,
    options: {
      action: TurnstileAction
      callback(token: string): void
      'error-callback'(): void
      'expired-callback'(): void
      sitekey: string
      size: 'flexible'
      theme: 'auto'
    },
  ): string
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | undefined

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile)
      else reject(new Error('Turnstile loaded without exposing its client API.'))
    }
    script.onerror = () => reject(new Error('Turnstile could not be loaded.'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function TurnstileWidget({
  action,
  onTokenChange,
  siteKey,
}: {
  action: TurnstileAction
  onTokenChange(token: string | undefined): void
  siteKey: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    let widgetId: string | undefined
    onTokenChange(undefined)

    void loadTurnstile()
      .then((turnstile) => {
        if (!active || !containerRef.current) return
        widgetId = turnstile.render(containerRef.current, {
          action,
          callback: (token) => onTokenChange(token),
          'error-callback': () => onTokenChange(undefined),
          'expired-callback': () => onTokenChange(undefined),
          sitekey: siteKey,
          size: 'flexible',
          theme: 'auto',
        })
      })
      .catch((error: unknown) => {
        console.error('Turnstile widget could not be initialized.', error)
        onTokenChange(undefined)
      })

    return () => {
      active = false
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [action, onTokenChange, siteKey])

  return <div className="min-h-16 w-full" ref={containerRef} />
}
