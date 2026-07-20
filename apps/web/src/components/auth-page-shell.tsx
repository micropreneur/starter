import { IndexLabel } from '@micropreneur/elements'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthPageShell({
  children,
  description,
  eyebrow,
  standalone = false,
  title,
}: {
  children: ReactNode
  description: string
  eyebrow: string
  standalone?: boolean
  title: string
}) {
  return (
    <main
      className={`grid w-full lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,0.7fr)] ${
        standalone
          ? 'min-h-screen'
          : 'mx-auto min-h-[calc(100vh-7rem)] max-w-7xl border-x border-border/60'
      }`}
    >
      <section className="bg-grain hidden border-r p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <a className="flex items-center gap-2 text-sm font-medium" href="/">
          <img
            alt=""
            aria-hidden="true"
            className="size-8 rounded-lg ring-1 ring-border/40"
            height="32"
            src="/favicon.png"
            width="32"
          />
          Micropreneur Starter
        </a>
        <div className="max-w-lg py-16">
          <IndexLabel>Activation, not administration</IndexLabel>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em]">
            Begin with a useful workspace, not an empty shell.
          </h2>
          <ul className="mt-7 grid gap-3 text-sm text-muted-foreground">
            {[
              'One secure personal workspace in Free Starter',
              'A first dashboard shaped by a few useful answers',
              'Clean seams for organizations and teams in Starter Pro',
            ].map((item) => (
              <li className="flex items-start gap-2" key={item}>
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          Free Starter never exposes workspace switching, invitations, team roles, or organization
          billing. Those remain explicit Starter Pro extensions.
        </p>
      </section>

      <section className="flex items-center px-5 py-12 sm:px-10 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-lg">
          <IndexLabel>{eyebrow}</IndexLabel>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
      </section>
    </main>
  )
}
