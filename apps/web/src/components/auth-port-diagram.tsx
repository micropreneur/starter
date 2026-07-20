import { Braces, PanelsTopLeft, ShieldCheck, UserRoundCheck } from 'lucide-react'

export function AuthPortDiagram({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-label="Application code depends on an authentication port, while Better Auth and Descope remain replaceable adapters at the edge."
      className="dark h-full bg-background p-5 text-foreground sm:p-7"
      role="img"
    >
      <div
        className={
          compact
            ? 'grid h-full content-center gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center'
            : 'grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center'
        }
      >
        <DiagramGroup label="Application code">
          <DiagramItem icon={PanelsTopLeft}>Routes and UI</DiagramItem>
          <DiagramItem icon={Braces}>Server actions</DiagramItem>
        </DiagramGroup>

        <div className="flex items-center justify-center gap-2 py-1 text-muted-foreground">
          <span aria-hidden="true" className="h-px w-6 border-t border-dashed border-current" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em]">depends on</span>
          <span aria-hidden="true" className="h-px w-6 border-t border-dashed border-current" />
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-dashed border-accent p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
              AuthPort
            </p>
            <p className="mt-2 text-sm font-medium">The stable contract</p>
            {!compact && (
              <p className="mt-1 font-mono text-[11px] leading-5 text-muted-foreground">
                getSession · signIn · signOut · requireUser
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DiagramItem icon={UserRoundCheck}>Better Auth</DiagramItem>
            <DiagramItem icon={ShieldCheck}>Descope</DiagramItem>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiagramGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-2">{children}</div>
    </div>
  )
}

function DiagramItem({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Braces }) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-xs font-medium">{children}</span>
    </div>
  )
}
