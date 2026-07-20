import { Client } from '@modelcontextprotocol/client'
import { InMemoryTransport } from '@modelcontextprotocol/server'
import { afterEach, describe, expect, it } from 'vitest'

import { createMicropreneurMcpServer } from './server'

describe('Micropreneur Starter MCP server', () => {
  const closeables: Array<{ close: () => Promise<void> }> = []

  afterEach(async () => {
    await Promise.all(closeables.splice(0).map((closeable) => closeable.close()))
  })

  it('starts, lists tools, and returns registry search results', async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const server = createMicropreneurMcpServer({ registryUrl: 'http://registry.test/r' })
    const client = new Client({ name: 'starter-verification', version: '0.1.0' })
    closeables.push(client, server)

    await server.connect(serverTransport)
    await client.connect(clientTransport)

    const tools = await client.listTools()
    expect(tools.tools.map((tool) => tool.name)).toEqual([
      'list_components',
      'search_components',
      'get_component',
      'list_themes',
      'search_themes',
      'get_theme',
      'list_docs',
      'search_docs',
      'get_doc',
      'list_skills',
      'search_skills',
      'get_skill',
    ])

    const result = await client.callTool({
      name: 'search_components',
      arguments: { query: 'grid' },
    })
    expect(JSON.stringify(result.content)).toContain('data-grid')
    expect(JSON.stringify(result.content)).toContain('http://registry.test/r/data-grid.json')

    const themeResult = await client.callTool({
      name: 'search_themes',
      arguments: { query: 'amber' },
    })
    expect(JSON.stringify(themeResult.content)).toContain('theme-amber-minimal')
    expect(JSON.stringify(themeResult.content)).toContain(
      'http://registry.test/r/theme-amber-minimal.json',
    )

    const docsResult = await client.callTool({
      name: 'search_docs',
      arguments: { query: 'webhook' },
    })
    expect(JSON.stringify(docsResult.content)).toContain('integrations/stripe')

    const docResult = await client.callTool({
      name: 'get_doc',
      arguments: { id: 'agents/mcp-server' },
    })
    expect(JSON.stringify(docResult.content)).toContain('## Available tools')

    const skillResult = await client.callTool({
      name: 'get_skill',
      arguments: { name: 'starter-repo' },
    })
    expect(JSON.stringify(skillResult.content)).toContain('nearest local `AGENTS.md`')
  })

  it('rejects inputs outside the public read-only contract', async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const server = createMicropreneurMcpServer()
    const client = new Client({ name: 'starter-validation', version: '0.1.0' })
    closeables.push(client, server)

    await server.connect(serverTransport)
    await client.connect(clientTransport)

    const invalid = await client.callTool({
      name: 'search_docs',
      arguments: { query: 'x'.repeat(241) },
    })
    expect(invalid.isError).toBe(true)
    expect(JSON.stringify(invalid.content)).toContain('expected string to have <=240 characters')

    const missing = await client.callTool({
      name: 'get_skill',
      arguments: { name: 'missing-skill' },
    })
    expect(missing.isError).toBe(true)
    expect(JSON.stringify(missing.content)).toContain('Unknown skill')
  })
})
