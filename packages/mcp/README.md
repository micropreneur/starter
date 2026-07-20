# `@micropreneur/mcp`

This package owns Micropreneur Starter's transport-neutral MCP server factory and its Node-only stdio executable. Coding agents can search and fetch public guides, canonical shared skills, free components, and themes without scraping either app. Component install commands come from the Elements catalog, while docs and skills come from the generated public corpus in `src/generated/agent-content.json`.

The docs Worker imports `createMicropreneurMcpServer({ registryUrl })` and serves it at `https://docs.micropreneur.dev/mcp`. Auth, rate limits, premium access, and automatic installation are intentionally not included.

## Run

```bash
pnpm --filter @micropreneur/mcp dev
```

The stdio executable writes MCP JSON-RPC only to stdout. Configure an agent with a command equivalent to:

```json
{
  "mcpServers": {
    "micropreneur-starter": {
      "command": "pnpm",
      "args": ["--dir", "/absolute/path/to/starter", "--filter", "@micropreneur/mcp", "dev"],
      "env": {
        "ELEMENTS_REGISTRY_URL": "http://localhost:4173/r"
      }
    }
  }
}
```

Available tools:

- `list_components`: all free items and ontology metadata.
- `search_components`: case-insensitive name, description, and ontology search.
- `get_component`: exact metadata, docs path, item URL, and `shadcn add` command.
- `list_themes`: all free theme presets and source metadata.
- `search_themes`: case-insensitive name, description, and source search.
- `get_theme`: exact theme tokens, attribution, item URL, and `shadcn add` command.
- `list_docs`: metadata and canonical/raw paths for public guides and component references.
- `search_docs`: ranked metadata and full-content search with concise matching snippets.
- `get_doc`: complete canonical Markdown for one guide or component reference.
- `list_skills`: metadata and raw paths for canonical shared skills.
- `search_skills`: skill name, description, and instruction search.
- `get_skill`: complete canonical Markdown for one shared skill.

The generated corpus is committed so the MCP server does not depend on a running docs app. After changing docs, component Markdown, or a shared skill, run:

```bash
pnpm docs:generate
pnpm --filter docs agent:check
```

Run `pnpm --filter @micropreneur/mcp test` for registry and knowledge coverage plus a protocol-level SDK client/server test over an in-memory MCP transport. Keep `src/server.ts` runtime-neutral: Node globals, stdio, and `node:*` imports belong only in `src/stdio.ts`.
