import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Blocks, Bot, type LucideIcon, ShieldCheck } from 'lucide-react'

import { AuthPortDiagram } from '../components/auth-port-diagram'
import { type BlogPost, formatBlogDate, getBlogPosts } from '../lib/blog'

export const Route = createFileRoute('/blog/')({
  head: () => ({
    meta: [
      { title: 'Blog · Micropreneur Starter' },
      {
        name: 'description',
        content:
          'Architecture decisions, local workflows, and source-owned interface patterns from Micropreneur Starter.',
      },
    ],
  }),
  component: BlogIndex,
})

const categoryIcons: Record<BlogPost['category'], LucideIcon> = {
  Architecture: ShieldCheck,
  'Developer experience': Bot,
  Interface: Blocks,
}

function BlogIndex() {
  const posts = getBlogPosts()
  const featuredPost = posts.find((post) => post.featured) ?? posts[0]
  const secondaryPosts = posts.filter((post) => post.slug !== featuredPost?.slug)

  if (!featuredPost) return null

  return (
    <>
      <section className="px-6 pt-20 pb-10 sm:px-10 sm:pt-24 sm:pb-12 lg:px-16">
        <h1 className="max-w-[16ch] text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
          Notes for building smaller, sharper software<span className="text-accent">.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          Architecture decisions, local workflows, and source-owned interface patterns from the
          public Starter repository.
        </p>
      </section>

      <section className="px-6 pb-24 sm:px-10 sm:pb-32 lg:px-16">
        <Link
          aria-label={`Read ${featuredPost.title}`}
          className="group grid overflow-hidden rounded-2xl border border-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:grid-cols-[1.08fr_0.92fr]"
          params={{ slug: featuredPost.slug }}
          to="/blog/$slug"
        >
          <div className="min-h-72">
            <AuthPortDiagram />
          </div>
          <article className="flex min-h-72 flex-col p-6 sm:p-8 lg:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              {featuredPost.category}
            </p>
            <h2 className="mt-5 max-w-md text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">
              {featuredPost.title}
            </h2>
            <p className="mt-4 max-w-lg pb-6 text-pretty text-muted-foreground">
              {featuredPost.description}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-6 text-sm text-muted-foreground">
              <time dateTime={featuredPost.date}>{formatBlogDate(featuredPost.date)}</time>
              <span aria-hidden="true" className="h-4 w-px bg-border" />
              <span>{featuredPost.readTime}</span>
              <span className="ml-auto inline-flex items-center gap-2 font-medium text-foreground">
                Read article
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </article>
        </Link>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {secondaryPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </>
  )
}

function BlogCard({ post }: { post: BlogPost }) {
  const Icon = categoryIcons[post.category]

  return (
    <Link
      className="group flex min-h-72 flex-col rounded-2xl border border-border/70 p-6 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-8"
      params={{ slug: post.slug }}
      to="/blog/$slug"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-11 items-center justify-center rounded-xl border bg-muted/30">
          <Icon className="size-5 text-accent" />
        </span>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {post.category}
        </p>
      </div>
      <h2 className="mt-8 max-w-md text-2xl leading-tight font-semibold tracking-[-0.025em]">
        {post.title}
      </h2>
      <p className="mt-3 max-w-lg pb-5 text-sm text-muted-foreground">{post.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-5 text-sm text-muted-foreground">
        <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
        <span aria-hidden="true" className="h-4 w-px bg-border" />
        <span>{post.readTime}</span>
        <ArrowRight className="ml-auto size-4 text-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
