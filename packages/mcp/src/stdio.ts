import { serveStdio } from '@modelcontextprotocol/server/stdio'

import { createMicropreneurMcpServer } from './server'

export function main() {
  return serveStdio(() =>
    createMicropreneurMcpServer({ registryUrl: process.env.ELEMENTS_REGISTRY_URL }),
  )
}

main()
