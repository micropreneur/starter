import type { AuthUser } from '@micropreneur/auth'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@micropreneur/elements/primitives'
import { ChevronsUpDown, LogOut, Settings2 } from 'lucide-react'
import { useState } from 'react'

function initialsFor(user: AuthUser) {
  const source = user.name.trim() || user.email
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function NavUser({ user }: { user: AuthUser }) {
  const { isMobile } = useSidebar()
  const [pending, setPending] = useState(false)
  const initials = initialsFor(user)

  async function signOut() {
    setPending(true)
    const response = await fetch('/api/sign-out', { method: 'POST' })
    if (response.ok) {
      window.location.assign('/')
      return
    }
    setPending(false)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
                size="lg"
              />
            }
          >
            <Avatar className="rounded-lg after:rounded-lg">
              {user.image ? (
                <AvatarImage alt={user.name} className="rounded-lg" src={user.image} />
              ) : null}
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="rounded-lg after:rounded-lg">
                    {user.image ? (
                      <AvatarImage alt={user.name} className="rounded-lg" src={user.image} />
                    ) : null}
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<a href="/app/settings" />}>
              <Settings2 />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={pending}
              onClick={() => void signOut()}
              variant="destructive"
            >
              <LogOut />
              {pending ? 'Signing out…' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
