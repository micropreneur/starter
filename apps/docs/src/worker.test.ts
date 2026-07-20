import { describe, expect, it, vi } from 'vitest'

import { type DocsBindings, handleRequest } from './worker'

const context = {} as ExecutionContext

function createEnv() {
  const fetch = vi.fn(async (request: Request) => {
    const pathname = new URL(request.url).pathname
    return new Response(`asset:${pathname}`, {
      headers: { 'Content-Type': pathname.endsWith('.json') ? 'application/json' : 'text/plain' },
    })
  })

  return {
    env: {
      ASSETS: { fetch } as unknown as Fetcher,
      ELEMENTS_REGISTRY_URL: 'https://elements.micropreneur.dev/r',
      PUBLIC_DOCS_ORIGIN: 'https://docs.micropreneur.dev',
    } satisfies DocsBindings,
    fetch,
  }
}

describe('docs Worker routing', () => {
  it('serves docs assets and rejects unknown hosts', async () => {
    const { env } = createEnv()

    const docs = await handleRequest(
      new Request('https://docs.micropreneur.dev/getting-started/introduction'),
      env,
      context,
    )
    expect(docs.status).toBe(200)
    await expect(docs.text()).resolves.toBe('asset:/getting-started/introduction')

    const unknown = await handleRequest(
      new Request('https://untrusted.example/getting-started/introduction'),
      env,
      context,
    )
    expect(unknown.status).toBe(421)
  })

  it('serves only registry assets on the Elements hostname', async () => {
    const { env } = createEnv()

    const item = await handleRequest(
      new Request('https://elements.micropreneur.dev/r/status-badge.json'),
      env,
      context,
    )
    expect(item.status).toBe(200)
    expect(item.headers.get('Cache-Control')).toBe('public, max-age=300')
    await expect(item.text()).resolves.toBe('asset:/r/status-badge.json')

    const guide = await handleRequest(
      new Request('https://elements.micropreneur.dev/anything'),
      env,
      context,
    )
    expect(guide.status).toBe(308)
    expect(guide.headers.get('Location')).toBe(
      'https://docs.micropreneur.dev/elements/installing-free',
    )

    const mutation = await handleRequest(
      new Request('https://elements.micropreneur.dev/r/status-badge.json', { method: 'POST' }),
      env,
      context,
    )
    expect(mutation.status).toBe(405)
    expect(mutation.headers.get('Allow')).toBe('GET, HEAD')
  })

  it('redirects registry requests on the canonical docs hostname', async () => {
    const { env } = createEnv()
    const response = await handleRequest(
      new Request('https://docs.micropreneur.dev/r/status-badge.json?source=docs'),
      env,
      context,
    )

    expect(response.status).toBe(308)
    expect(response.headers.get('Location')).toBe(
      'https://elements.micropreneur.dev/r/status-badge.json?source=docs',
    )
  })

  it('keeps preview hosts self-contained', async () => {
    const { env } = createEnv()
    const previewOrigin = 'https://micropreneur-starter-docs.example.workers.dev'
    const preview = await handleRequest(new Request(`${previewOrigin}/r/card.json`), env, context)

    expect(preview.status).toBe(200)
    await expect(preview.text()).resolves.toBe('asset:/r/card.json')

    const component = await handleRequest(
      mcpRequest(
        'tools/call',
        { arguments: { name: 'card' }, name: 'get_component' },
        `${previewOrigin}/mcp`,
      ),
      env,
      context,
    )
    expect(JSON.stringify(await readMcpResponse(component))).toContain(
      `${previewOrigin}/r/card.json`,
    )
  })

  it('serves MCP initialize, tool discovery, and tool calls without caching', async () => {
    const { env } = createEnv()

    const initialize = await handleRequest(
      mcpRequest('initialize', {
        capabilities: {},
        clientInfo: { name: 'docs-worker-test', version: '0.1.0' },
        protocolVersion: '2025-06-18',
      }),
      env,
      context,
    )
    expect(initialize.status, await initialize.clone().text()).toBe(200)
    expect(initialize.headers.get('Cache-Control')).toBe('no-store')
    expect(await readMcpResponse(initialize)).toEqual(
      expect.objectContaining({
        result: expect.objectContaining({ serverInfo: expect.any(Object) }),
      }),
    )

    const tools = await handleRequest(mcpRequest('tools/list', {}), env, context)
    const toolsBody = (await readMcpResponse(tools)) as {
      result?: { tools?: Array<{ name: string }> }
    }
    expect(toolsBody.result?.tools?.map((tool) => tool.name)).toContain('get_doc')

    const call = await handleRequest(
      mcpRequest('tools/call', {
        arguments: { name: 'starter-repo' },
        name: 'get_skill',
      }),
      env,
      context,
    )
    expect(JSON.stringify(await readMcpResponse(call))).toContain('nearest local `AGENTS.md`')
  })
})

function mcpRequest(method: string, params: unknown, url = 'https://docs.micropreneur.dev/mcp') {
  const origin = new URL(url)
  return new Request(url, {
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      Host: origin.host,
      'MCP-Protocol-Version': '2025-06-18',
      Origin: origin.origin,
    },
    method: 'POST',
  })
}

async function readMcpResponse(response: Response) {
  const body = await response.text()
  if (!response.headers.get('Content-Type')?.includes('text/event-stream')) {
    return JSON.parse(body) as unknown
  }

  const data = body
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice('data: '.length))
    .at(-1)
  if (!data) throw new Error(`MCP response did not include an SSE data event: ${body}`)
  return JSON.parse(data) as unknown
}
