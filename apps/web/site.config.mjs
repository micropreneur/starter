// @ts-check

/**
 * The public identity for this fork. Keep deployment-specific secrets and provider
 * credentials out of this file; VITE_PUBLIC_SITE_URL may override defaultOrigin per
 * environment.
 *
 * @typedef {object} SiteConfiguration
 * @property {string} badge
 * @property {string} brandName
 * @property {string} defaultOrigin
 * @property {string} description
 * @property {string} docsUrl
 * @property {string} name
 * @property {string} repositoryUrl
 * @property {string} socialUrl
 * @property {string} supportEmail
 * @property {{ label: string, url: string }} attribution
 * @property {{ alt: string, description: string, eyebrow: string, path: string, stack: string[], tagline: string }} socialImage
 */

/** @satisfies {SiteConfiguration} */
export const siteConfig = {
  name: 'Micropreneur Starter',
  brandName: 'Micropreneur',
  badge: 'Starter',
  description:
    'The public, fork-and-go foundation for building a smaller business and owning a bigger life.',
  defaultOrigin: 'https://starter.micropreneur.dev',
  repositoryUrl: 'https://github.com/micropreneur/starter',
  docsUrl: 'https://docs.micropreneur.dev',
  supportEmail: 'dan@micropreneur.dev',
  socialUrl: 'https://www.x.com/micropreneurial',
  attribution: {
    label: 'Built with Micropreneur',
    url: 'https://www.micropreneur.dev',
  },
  socialImage: {
    alt: 'Micropreneur Starter, a fork-and-go SaaS foundation',
    description: 'A source-owned social preview for the fork-and-go SaaS foundation.',
    eyebrow: 'OPEN SOURCE · MIT',
    path: '/og/starter.png',
    stack: ['TANSTACK START', 'CLOUDFLARE', 'STRICT TYPESCRIPT'],
    tagline: 'Fork the foundation. Build the product.',
  },
}
