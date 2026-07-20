import { describe, expect, it } from 'vitest'

import { getBlogPost, getBlogPosts } from './blog'

describe('blog content registry', () => {
  it('discovers repository-backed MDX posts in newest-first order', () => {
    const posts = getBlogPosts()

    expect(posts).toHaveLength(3)
    expect(posts.map((post) => post.slug)).toEqual([
      'why-authentication-starts-with-a-port',
      'the-local-loop-is-part-of-the-starter',
      'own-the-components-not-another-package',
    ])
    expect(posts.filter((post) => post.featured)).toHaveLength(1)
  })

  it('returns the compiled MDX component for a known slug', () => {
    const post = getBlogPost('why-authentication-starts-with-a-port')

    expect(post?.title).toBe('Why authentication starts with a port')
    expect(post?.Content).toBeTypeOf('function')
    expect(getBlogPost('missing-post')).toBeUndefined()
  })
})
