import type { MDXContent } from 'mdx/types.js'

export type BlogPostMeta = {
  author: string
  category: 'Architecture' | 'Developer experience' | 'Interface'
  date: string
  description: string
  featured?: boolean
  readTime: string
  sections: ReadonlyArray<{
    id: string
    title: string
  }>
  title: string
}

type BlogModule = {
  default: MDXContent
  meta: BlogPostMeta
}

export type BlogPost = BlogPostMeta & {
  Content: MDXContent
  slug: string
}

const modules = import.meta.glob<BlogModule>('../content/blog/*.mdx', {
  eager: true,
})

const posts = Object.entries(modules)
  .map(
    ([path, module]): BlogPost => ({
      ...module.meta,
      Content: module.default,
      slug:
        path
          .split('/')
          .at(-1)
          ?.replace(/\.mdx$/, '') ?? '',
    }),
  )
  .filter((post) => post.slug.length > 0)
  .sort((first, second) => second.date.localeCompare(first.date))

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
