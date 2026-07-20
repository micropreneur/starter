import { createMicropreneurMcpServer } from '@micropreneur/mcp'
import { createMcpHandler } from 'agents/mcp/server'

const MCP_PATH = '/mcp'
const REGISTRY_PATH = '/r/'
const ELEMENTS_GUIDE_PATH = '/elements/installing-free'
const SHORT_CACHE = 'public, max-age=300'

export type DocsBindings = {
  ASSETS: Fetcher
  ELEMENTS_REGISTRY_URL: string
  PUBLIC_DOCS_ORIGIN: string
}

type RuntimeConfig = {
  docsOrigin: URL
  registryUrl: URL
  trustedHostnames: string[]
}

export async function handleRequest(request: Request, env: DocsBindings, ctx: ExecutionContext) {
  const requestUrl = new URL(request.url)
  const config = readRuntimeConfig(env, requestUrl)

  if (!config.trustedHostnames.includes(requestUrl.hostname)) {
    return new Response('Misdirected request.', { status: 421 })
  }

  const previewHost = isPreviewHostname(requestUrl.hostname)
  const registryHost = !previewHost && requestUrl.hostname === config.registryUrl.hostname

  if (registryHost) {
    if (!requestUrl.pathname.startsWith(REGISTRY_PATH)) {
      return Response.redirect(new URL(ELEMENTS_GUIDE_PATH, config.docsOrigin), 308)
    }
    return serveRegistryAsset(request, env)
  }

  if (requestUrl.pathname === `${MCP_PATH}/`) {
    return Response.redirect(new URL(MCP_PATH, requestUrl), 308)
  }

  if (requestUrl.pathname === MCP_PATH) {
    const handler = createMcpHandler(
      () =>
        createMicropreneurMcpServer({ registryUrl: config.registryUrl.href.replace(/\/$/, '') }),
      {
        allowedHostnames: config.trustedHostnames,
        allowedOriginHostnames: config.trustedHostnames,
        route: MCP_PATH,
      },
    )
    const response = await handler(request, env, ctx)
    return withHeaders(response, { 'Cache-Control': 'no-store' })
  }

  if (!previewHost && requestUrl.pathname.startsWith(REGISTRY_PATH)) {
    const destination = new URL(requestUrl.pathname.slice(REGISTRY_PATH.length), config.registryUrl)
    destination.search = requestUrl.search
    return Response.redirect(destination, 308)
  }

  if (previewHost && requestUrl.pathname.startsWith(REGISTRY_PATH)) {
    return serveRegistryAsset(request, env)
  }

  const response = await env.ASSETS.fetch(request)
  if (requestUrl.pathname.startsWith('/.well-known/')) {
    return withHeaders(response, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': SHORT_CACHE,
    })
  }
  return response
}

function readRuntimeConfig(env: DocsBindings, requestUrl: URL): RuntimeConfig {
  const docsOrigin = parseConfiguredUrl(env.PUBLIC_DOCS_ORIGIN, requestUrl.origin)
  const registryUrl = isPreviewHostname(requestUrl.hostname)
    ? new URL('/r/', requestUrl)
    : parseConfiguredUrl(env.ELEMENTS_REGISTRY_URL, new URL('/r/', requestUrl).href)
  registryUrl.pathname = `${registryUrl.pathname.replace(/\/$/, '')}/`
  registryUrl.search = ''
  registryUrl.hash = ''
  const trustedHostnames = new Set([docsOrigin.hostname, registryUrl.hostname])
  if (isPreviewHostname(requestUrl.hostname)) trustedHostnames.add(requestUrl.hostname)

  return { docsOrigin, registryUrl, trustedHostnames: [...trustedHostnames] }
}

function parseConfiguredUrl(value: string | undefined, fallback: string) {
  const url = new URL(value || fallback)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Unsupported public origin protocol: ${url.protocol}`)
  }
  return url
}

function isPreviewHostname(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.workers.dev')
  )
}

async function serveRegistryAsset(request: Request, env: DocsBindings) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed.', { headers: { Allow: 'GET, HEAD' }, status: 405 })
  }
  const response = await env.ASSETS.fetch(request)
  return withHeaders(response, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': SHORT_CACHE,
  })
}

function withHeaders(response: Response, headers: Record<string, string>) {
  const nextHeaders = new Headers(response.headers)
  for (const [name, value] of Object.entries(headers)) nextHeaders.set(name, value)
  return new Response(response.body, {
    headers: nextHeaders,
    status: response.status,
    statusText: response.statusText,
  })
}

export default {
  fetch: handleRequest,
} satisfies ExportedHandler<DocsBindings>
