import { describe, expect, it } from 'vitest'
import { getBlogPost, getBlogPosts } from './blog'
import { validateBlogSources } from './blog-contract'
import { getBlogPostSummaries } from './blog-metadata'

const validSource = `export const meta = {
  author: 'Example Author',
  category: 'Architecture',
  date: '2026-08-30',
  description: 'A useful description.',
  readTime: '4 min read',
  sections: [{ id: 'first-section', title: 'First section' }],
  title: 'Example post',
}

## First section

Article copy.
`

describe('blog content registry', () => {
  it('discovers repository-backed MDX posts in newest-first order', () => {
    const posts = getBlogPosts()
    const dates = posts.map((post) => post.date)

    expect(posts.length).toBeGreaterThan(0)
    expect(dates).toEqual([...dates].sort((first, second) => second.localeCompare(first)))
    expect(new Set(posts.map((post) => post.slug)).size).toBe(posts.length)
    expect(posts.filter((post) => post.featured).length).toBeLessThanOrEqual(1)
    expect(getBlogPostSummaries().map((post) => post.slug)).toEqual(posts.map((post) => post.slug))
  })

  it('returns the compiled MDX component for a known slug', () => {
    const post = getBlogPost('why-authentication-starts-with-a-port')

    expect(post?.title).toBe('Why authentication starts with a port')
    expect(post?.Content).toBeTypeOf('function')
    expect(getBlogPost('missing-post')).toBeUndefined()
  })

  it('rejects invalid slugs before content is built', () => {
    expect(() =>
      validateBlogSources([
        { source: validSource, sourcePath: 'apps/web/src/content/blog/Not Valid.mdx' },
      ]),
    ).toThrow('must use a lowercase kebab-case .mdx filename')
  })

  it('rejects metadata that does not match level-two headings', () => {
    const source = validSource.replace("id: 'first-section'", "id: 'missing-section'")

    expect(() =>
      validateBlogSources([{ source, sourcePath: 'apps/web/src/content/blog/example-post.mdx' }]),
    ).toThrow(
      'meta.sections ids must match its level-two headings in order. Expected: first-section. Received: missing-section.',
    )
  })

  it('rejects ambiguous featured content', () => {
    const featuredSource = validSource.replace(
      "description: 'A useful description.',",
      "description: 'A useful description.',\n  featured: true,",
    )

    expect(() =>
      validateBlogSources([
        {
          source: featuredSource,
          sourcePath: 'apps/web/src/content/blog/first-post.mdx',
        },
        {
          source: featuredSource,
          sourcePath: 'apps/web/src/content/blog/second-post.mdx',
        },
      ]),
    ).toThrow('Blog content may only have one featured post. Found: first-post, second-post.')
  })

  it('rejects malformed metadata with an actionable field name', () => {
    const source = validSource.replace("author: 'Example Author'", "author: ''")

    expect(() =>
      validateBlogSources([{ source, sourcePath: 'apps/web/src/content/blog/example-post.mdx' }]),
    ).toThrow('meta.author must be a non-empty string')
  })

  it('rejects invalid publication dates with the expected format', () => {
    const source = validSource.replace("date: '2026-08-30'", "date: '2026-99-99'")

    expect(() =>
      validateBlogSources([{ source, sourcePath: 'apps/web/src/content/blog/example-post.mdx' }]),
    ).toThrow('meta.date must be a valid YYYY-MM-DD date')
  })
})
