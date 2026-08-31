import type { MDXContent } from 'mdx/types.js'

import { getBlogPostSummaries } from './blog-metadata'
import type { BlogPostMeta } from './blog-schema'

export type { BlogPostMeta } from './blog-schema'

export type BlogPost = BlogPostMeta & {
  Content: MDXContent
  slug: string
}

const contentModules = import.meta.glob<MDXContent>('../content/blog/*.mdx', {
  eager: true,
  import: 'default',
})

const contentBySlug = new Map(
  Object.entries(contentModules).map(([path, Content]) => [
    path
      .split('/')
      .at(-1)
      ?.replace(/\.mdx$/, '') ?? '',
    Content,
  ]),
)

const posts = getBlogPostSummaries().map((summary): BlogPost => {
  const Content = contentBySlug.get(summary.slug)
  if (!Content) {
    throw new Error(`Missing compiled MDX content for blog post "${summary.slug}".`)
  }

  return {
    ...summary,
    Content,
  }
})

export function getBlogPosts(): ReadonlyArray<BlogPost> {
  return posts
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug)
}

export function formatBlogDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`))
}
