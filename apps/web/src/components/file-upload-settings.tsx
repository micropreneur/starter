import type { AuthUser } from '@micropreneur/auth'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldError,
  Input,
} from '@micropreneur/elements'
import { Avatar, AvatarFallback, AvatarImage } from '@micropreneur/elements/primitives'
import type { ActiveWorkspace } from '@micropreneur/workspaces'
import { useRouter } from '@tanstack/react-router'
import { Building2, UserRound } from 'lucide-react'
import { type ReactNode, useState } from 'react'

export function FileUploadSettings({
  enabled,
  user,
  workspace,
}: {
  enabled: boolean
  user: AuthUser
  workspace: ActiveWorkspace
}) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <ImageUploadCard
        currentUrl={user.image}
        description="An account-owned image served through an authenticated R2 route."
        enabled={enabled}
        icon={<UserRound className="size-4" />}
        kind="avatar"
        name={user.name}
        title="Avatar"
      />
      <ImageUploadCard
        currentUrl={workspace.avatarUrl}
        description="A workspace-owned image that stays inside the personal workspace boundary."
        enabled={enabled}
        icon={<Building2 className="size-4" />}
        kind="logo"
        name={workspace.name}
        title="Workspace logo"
      />
    </section>
  )
}

function ImageUploadCard({
  currentUrl,
  description,
  enabled,
  icon,
  kind,
  name,
  title,
}: {
  currentUrl?: string | null
  description: string
  enabled: boolean
  icon: ReactNode
  kind: 'avatar' | 'logo'
  name: string
  title: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)
  const maxSize = kind === 'avatar' ? '2 MB' : '5 MB'

  async function upload(file: File | undefined) {
    if (!file) return
    setPending(true)
    setError(undefined)
    setMessage(undefined)
    try {
      const grantResponse = await postJson('/api/files/upload-url', {
        contentType: file.type,
        kind,
        size: file.size,
      })
      if (!grantResponse.ok) throw new Error(await responseError(grantResponse))
      const grant = (await grantResponse.json()) as {
        expiresAt: string
        headers: { 'content-type': string }
        key: string
        maxBytes: number
        uploadUrl: string
      }
      if (file.size > grant.maxBytes) throw new Error(`${title} exceeds the ${maxSize} limit.`)
      if (Date.parse(grant.expiresAt) <= Date.now()) throw new Error('The upload URL expired.')

      const uploadResponse = await fetch(grant.uploadUrl, {
        body: file,
        headers: grant.headers,
        method: 'PUT',
      })
      if (!uploadResponse.ok) {
        throw new Error(
          'R2 rejected the upload. Refresh the page and check the bucket CORS policy.',
        )
      }
      const completion = await postJson('/api/files/complete', { key: grant.key, kind })
      if (!completion.ok) throw new Error(await responseError(completion))

      setMessage(`${title} updated.`)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The image upload failed.')
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    setPending(true)
    setError(undefined)
    setMessage(undefined)
    try {
      const response = await fetch(`/api/files/${kind}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await responseError(response))
      setMessage(`${title} removed.`)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The image could not be removed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 rounded-lg after:rounded-lg">
            {currentUrl ? (
              <AvatarImage
                alt={`${name} ${title.toLowerCase()}`}
                className="rounded-lg"
                src={currentUrl}
              />
            ) : null}
            <AvatarFallback className="rounded-lg">{initialsFor(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-xs text-muted-foreground">
            PNG, JPEG, or WebP. Maximum {maxSize}.
            {!enabled ? (
              <span className="mt-1 block">
                Configure optional R2 signing values to enable uploads.
              </span>
            ) : null}
          </div>
        </div>
        <Input
          accept="image/jpeg,image/png,image/webp"
          aria-label={`Choose ${title.toLowerCase()}`}
          disabled={!enabled || pending}
          onChange={(event) => {
            const input = event.currentTarget
            void upload(input.files?.[0]).finally(() => {
              input.value = ''
            })
          }}
          type="file"
        />
        {currentUrl ? (
          <Button disabled={pending} onClick={() => void remove()} type="button" variant="outline">
            Remove {title.toLowerCase()}
          </Button>
        ) : null}
        {error ? <FieldError>{error}</FieldError> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  )
}

function postJson(url: string, body: unknown) {
  return fetch(url, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
}

async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string
    message?: string
  } | null
  return body?.message ?? body?.error ?? `Request failed (${response.status}).`
}

function initialsFor(value: string) {
  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
