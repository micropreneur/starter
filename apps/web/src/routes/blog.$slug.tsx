import { buttonVariants } from '@micropreneur/elements'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AuthPortDiagram } from '../components/auth-port-diagram'
import { blogMdxComponents } from '../components/blog-content'
import { formatBlogDate, getBlogPost, getBlogPosts } from '../lib/blog'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getBlogPost(params.slug)
    if (!post) throw notFound()

    return {
      author: post.author,
      category: post.category,
      date: post.date,
      description: post.description,
      readTime: post.readTime,
      sections: post.sections,
      title: post.title,
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} · Micropreneur Starter` },
          { name: 'description', content: loaderData.description },
          { property: 'og:title', content: loaderData.title },
          { property: 'og:description', content: loaderData.description },
          { property: 'og:type', content: 'article' },
        ]
      : [],
  }),
  notFoundComponent: BlogPostNotFound,
  component: BlogPostPage,
})

function BlogPostPage() {
  const meta = Route.useLoaderData()
  const { slug } = Route.useParams()
  const post = getBlogPost(slug)

  if (!post) return <BlogPostNotFound />

  const otherPost = getBlogPosts().find((candidate) => candidate.slug !== post.slug)

  return (
    <article className="px-6 pt-12 pb-24 sm:px-10 sm:pt-16 sm:pb-32 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          to="/blog"
        >
          <ArrowLeft className="size-4" />
          Back to blog
        </Link>

        <header className="mt-12 max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            {meta.category}
          </p>
          <h1 className="mt-5 max-w-[15ch] text-balance text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            {meta.title}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            {meta.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>{meta.author}</span>
            <span aria-hidden="true" className="h-4 w-px bg-border" />
            <time dateTime={meta.date}>{formatBlogDate(meta.date)}</time>
            <span aria-hidden="true" className="h-4 w-px bg-border" />
            <span>{meta.readTime}</span>
          </div>
        </header>

        {post.featured && (
          <div className="mt-12 overflow-hidden rounded-2xl border border-border/70">
            <AuthPortDiagram />
          </div>
        )}

        <div className="mt-16 grid gap-12 lg:grid-cols-[11rem_minmax(0,45rem)] lg:items-start lg:justify-center">
          <aside className="lg:sticky lg:top-24">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              On this page
            </p>
            <nav aria-label="Article sections" className="mt-4">
              <ol className="grid gap-3 text-sm">
                {meta.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      className="text-muted-foreground transition-colors hover:text-accent"
                      href={`#${section.id}`}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="min-w-0">
            <div className="blog-prose prose prose-lg prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:tracking-[-0.03em] prose-a:font-medium prose-a:text-foreground prose-a:decoration-accent prose-a:decoration-2 prose-a:underline-offset-4 prose-blockquote:border-l-accent prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-th:font-medium prose-img:shadow-none">
              <post.Content components={blogMdxComponents} />
            </div>

            {otherPost && (
              <Link
                className="group mt-16 block rounded-2xl border border-border/70 p-6 transition-colors hover:bg-muted/30 sm:p-8"
                params={{ slug: otherPost.slug }}
                to="/blog/$slug"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Read next
                </p>
                <div className="mt-4 flex items-end justify-between gap-6">
                  <div>
                    <h2 className="text-2xl leading-tight font-semibold tracking-[-0.025em]">
                      {otherPost.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">{otherPost.description}</p>
                  </div>
                  <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function BlogPostNotFound() {
  return (
    <section className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">404</p>
      <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">That note is not here.</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        The post may have moved, or this fork has not published it yet.
      </p>
      <Link className={`${buttonVariants()} mt-8`} to="/blog">
        Browse the blog
      </Link>
    </section>
  )
}
