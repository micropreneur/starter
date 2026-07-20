# Contributing

Thanks for helping improve `starter`.

## Development

1. Fork the repository and create a focused branch.
2. Install Node 22 and pnpm 9 (`corepack enable`).
3. Run `pnpm install`.
4. Make a narrow change with tests or another repeatable verification loop.
5. Run `pnpm turbo typecheck lint build test` before opening a pull request.

Use conventional commit subjects such as `feat(elements): add status timeline`. Never commit `.env`, `.dev.vars`, Cloudflare credentials, license keys, or generated local D1 state.

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
