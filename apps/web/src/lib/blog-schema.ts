export type BlogPostMeta = {
  author: string
  category: string
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

export type BlogPostSummary = BlogPostMeta & {
  slug: string
}
