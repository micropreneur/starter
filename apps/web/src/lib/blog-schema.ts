export const blogCategories = ['Architecture', 'Developer experience', 'Interface'] as const

export type BlogCategory = (typeof blogCategories)[number]

export type BlogPostMeta = {
  author: string
  category: BlogCategory
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
