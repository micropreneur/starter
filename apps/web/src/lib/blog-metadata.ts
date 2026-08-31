import summaries from 'virtual:micropreneur-blog-metadata'

import type { BlogPostSummary } from './blog-schema'

export type { BlogPostSummary } from './blog-schema'

const sortedSummaries = [...summaries].sort((first, second) =>
  second.date.localeCompare(first.date),
)

export function getBlogPostSummaries(): ReadonlyArray<BlogPostSummary> {
  return sortedSummaries
}
