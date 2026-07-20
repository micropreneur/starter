# LLMs Integration

> Consume Starter guides as raw Markdown, concise LLM indexes, or a structured public content manifest.

Starter derives every machine-readable interface from the same MDX articles, Elements catalog, and
canonical shared skills used by the human documentation site.

## Raw Markdown

Append `.md` to a documentation URL to fetch its Markdown representation:

```text
/getting-started/running-locally
/getting-started/running-locally.md
```

Component references remain available beneath `/components/<name>.md`. The page actions menu can
copy the Markdown, copy its URL, or open it directly in an AI assistant.

## LLM indexes

Use the smallest representation that fits the task:

- `/llms.txt` lists every public guide, component, skill, and the MCP entrypoint.
- `/llms-full.txt` concatenates the complete public corpus for one-shot ingestion.

Both files contain public Starter source only. They do not contain secrets, application data, or
private Elements Pro documentation.

## Structured content

`/agent-content.json` exposes document and skill metadata without requiring a client to parse the
rendered application. The same generated data backs the local and hosted MCP tools.

## Generation and drift

After changing an article, component Markdown file, or shared skill, regenerate the interfaces:

```bash
pnpm docs:generate
pnpm --filter docs agent:check
```

Local docs development regenerates artifacts before Vite starts. Builds and tests use check mode so
stale committed output fails with the exact command required to repair it.

## UTF-8 contract

Raw Markdown is served as `text/markdown; charset=utf-8`; LLM indexes use UTF-8 plain text; JSON
manifests use UTF-8 JSON. Generator tests retain tree glyphs such as `├──` and `└──` byte-for-byte so
copying a raw page cannot silently introduce mojibake.
