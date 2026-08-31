import { siteConfig as sourceSiteConfig } from '../../site.config.mjs'

export type SiteConfiguration = {
  attribution: {
    label: string
    url: string
  }
  badge: string
  brandName: string
  defaultOrigin: string
  description: string
  docsUrl: string
  name: string
  repositoryUrl: string
  socialImage: {
    alt: string
    description: string
    eyebrow: string
    path: string
    stack: ReadonlyArray<string>
    tagline: string
  }
  socialUrl: string
  supportEmail: string
}

export const siteConfig: SiteConfiguration = sourceSiteConfig

assertSiteConfiguration(siteConfig)

export const siteLinks = {
  billingActivation: `${siteConfig.docsUrl.replace(/\/$/u, '')}/integrations/stripe`,
  docs: siteConfig.docsUrl,
  elements: `${siteConfig.repositoryUrl}/tree/main/packages/elements`,
  issues: `${siteConfig.repositoryUrl}/issues`,
  license: `${siteConfig.repositoryUrl}/blob/main/LICENSE`,
  quickstart: `${siteConfig.repositoryUrl}#quickstart`,
  repository: siteConfig.repositoryUrl,
  social: siteConfig.socialUrl,
  starterPro: siteConfig.attribution.url,
  support: `mailto:${siteConfig.supportEmail}`,
} as const

function assertSiteConfiguration(config: SiteConfiguration): void {
  for (const [field, value] of Object.entries({
    badge: config.badge,
    brandName: config.brandName,
    description: config.description,
    name: config.name,
    supportEmail: config.supportEmail,
  })) {
    if (!value.trim()) throw new Error(`site.config.mjs: ${field} must not be empty.`)
  }

  if (!config.supportEmail.includes('@')) {
    throw new Error('site.config.mjs: supportEmail must be an email address.')
  }

  for (const [field, value] of Object.entries({
    'attribution.url': config.attribution.url,
    defaultOrigin: config.defaultOrigin,
    docsUrl: config.docsUrl,
    repositoryUrl: config.repositoryUrl,
    socialUrl: config.socialUrl,
  })) {
    assertHttpUrl(field, value)
  }

  if (!config.socialImage.path.startsWith('/')) {
    throw new Error('site.config.mjs: socialImage.path must be root-relative.')
  }

  if (config.socialImage.stack.length !== 3) {
    throw new Error('site.config.mjs: socialImage.stack must contain exactly three labels.')
  }
}

function assertHttpUrl(field: string, value: string): void {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`site.config.mjs: ${field} must be an absolute HTTP(S) URL.`)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`site.config.mjs: ${field} must be an absolute HTTP(S) URL.`)
  }
}
