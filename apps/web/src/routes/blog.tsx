import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SiteFooter } from '../components/site-footer'

export const Route = createFileRoute('/blog')({
  component: BlogLayout,
})

function BlogLayout() {
  return (
    <main className="overflow-x-clip">
      <div className="mx-auto min-h-screen w-full max-w-7xl border-x border-border/60">
        <Outlet />
        <SiteFooter />
      </div>
    </main>
  )
}
