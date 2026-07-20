import { Button } from '@micropreneur/elements'
import { useState } from 'react'

export function SignOutButton() {
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    const response = await fetch('/api/sign-out', { method: 'POST' })
    if (response.ok) window.location.assign('/')
    else setPending(false)
  }

  return (
    <Button disabled={pending} onClick={signOut} size="sm" variant="outline">
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
