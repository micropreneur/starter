import { fileURLToPath } from 'node:url'

import { generateAgentDocs } from './agent-docs'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const check = process.argv.includes('--check')

try {
  const outputs = await generateAgentDocs(repoRoot, check)
  process.stdout.write(
    check
      ? `Agent documentation is current (${outputs.length} generated files).\n`
      : `Generated ${outputs.length} agent documentation files.\n`,
  )
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
