import { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import { getDoc, getSkill, listDocs, listSkills, searchDocs, searchSkills } from './knowledge'
import {
  getComponent,
  getTheme,
  listComponents,
  listThemes,
  searchComponents,
  searchThemes,
} from './registry'

export type MicropreneurMcpServerOptions = {
  registryUrl?: string
}

const identifierSchema = z.string().trim().min(1).max(120)
const searchQuerySchema = z.string().trim().max(240)

export function createMicropreneurMcpServer(options: MicropreneurMcpServerOptions = {}) {
  const { registryUrl } = options
  const server = new McpServer({
    name: 'micropreneur-starter',
    version: '0.1.0',
  })

  server.registerTool(
    'list_components',
    {
      description: 'List all free micropreneur elements and their ontology metadata.',
      inputSchema: {},
    },
    async () => asToolResult(listComponents(registryUrl)),
  )

  server.registerTool(
    'search_components',
    {
      description: 'Search free components by name, description, or ontology.',
      inputSchema: {
        query: searchQuerySchema.describe('Search text such as status, action, object, or grid.'),
      },
    },
    async ({ query }) => asToolResult(searchComponents(query, registryUrl)),
  )

  server.registerTool(
    'get_component',
    {
      description:
        'Fetch one component with its local registry URL, install command, and docs path.',
      inputSchema: {
        name: identifierSchema.describe('Exact registry item name, for example status-badge.'),
      },
    },
    async ({ name }) => {
      const component = getComponent(name, registryUrl)
      if (!component) {
        return {
          content: [{ type: 'text' as const, text: `Unknown component: ${name}` }],
          isError: true,
        }
      }
      return asToolResult(component)
    },
  )

  server.registerTool(
    'list_themes',
    {
      description: 'List free installable Elements themes and their source metadata.',
      inputSchema: {},
    },
    async () => asToolResult(listThemes(registryUrl)),
  )

  server.registerTool(
    'search_themes',
    {
      description: 'Search free Elements themes by name, description, or source.',
      inputSchema: {
        query: searchQuerySchema.describe(
          'Search text such as amber, minimal, editorial, or TweakCN.',
        ),
      },
    },
    async ({ query }) => asToolResult(searchThemes(query, registryUrl)),
  )

  server.registerTool(
    'get_theme',
    {
      description: 'Fetch one theme with its install command, token metadata, and attribution.',
      inputSchema: {
        name: identifierSchema.describe('Theme name such as starter or theme-clean-slate.'),
      },
    },
    async ({ name }) => {
      const theme = getTheme(name, registryUrl)
      if (!theme) {
        return {
          content: [{ type: 'text' as const, text: `Unknown theme: ${name}` }],
          isError: true,
        }
      }
      return asToolResult(theme)
    },
  )

  server.registerTool(
    'list_docs',
    {
      description:
        'List public Starter guides and component references with canonical and raw Markdown paths.',
      inputSchema: {},
    },
    async () => asToolResult(listDocs()),
  )

  server.registerTool(
    'search_docs',
    {
      description:
        'Search public Starter guides and component references by metadata and Markdown content.',
      inputSchema: {
        query: searchQuerySchema.describe(
          'Search text such as OAuth, webhook, D1, or dashboard shell.',
        ),
      },
    },
    async ({ query }) => asToolResult(searchDocs(query)),
  )

  server.registerTool(
    'get_doc',
    {
      description: 'Fetch one complete public document including its canonical Markdown content.',
      inputSchema: {
        id: identifierSchema.describe(
          'Document id, page path, or raw path such as integrations/stripe.',
        ),
      },
    },
    async ({ id }) => {
      const doc = getDoc(id)
      return doc ? asToolResult(doc) : unknownToolValue('document', id)
    },
  )

  server.registerTool(
    'list_skills',
    {
      description: 'List canonical shared agent skills inherited by Starter forks.',
      inputSchema: {},
    },
    async () => asToolResult(listSkills()),
  )

  server.registerTool(
    'search_skills',
    {
      description: 'Search canonical shared agent skills by name, description, or instructions.',
      inputSchema: {
        query: searchQuerySchema.describe('Search text such as auth, verification, or Base UI.'),
      },
    },
    async ({ query }) => asToolResult(searchSkills(query)),
  )

  server.registerTool(
    'get_skill',
    {
      description: 'Fetch the complete canonical Markdown for one shared agent skill.',
      inputSchema: {
        name: identifierSchema.describe('Skill name such as starter-repo.'),
      },
    },
    async ({ name }) => {
      const skill = getSkill(name)
      return skill ? asToolResult(skill) : unknownToolValue('skill', name)
    },
  )

  return server
}

export const createElementsMcpServer = createMicropreneurMcpServer

function asToolResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  }
}

function unknownToolValue(type: string, identifier: string) {
  return {
    content: [{ type: 'text' as const, text: `Unknown ${type}: ${identifier}` }],
    isError: true,
  }
}
