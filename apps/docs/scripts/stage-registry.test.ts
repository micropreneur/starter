import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { stageRegistry } from './stage-registry'

describe('registry staging', () => {
  it('replaces only the docs registry directory with the built registry', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'starter-registry-'))
    const source = path.join(repoRoot, 'packages/elements/dist/r')
    const publicRoot = path.join(repoRoot, 'apps/docs/public')
    await mkdir(source, { recursive: true })
    await mkdir(path.join(publicRoot, 'r'), { recursive: true })
    await writeFile(path.join(source, 'registry.json'), '{"name":"free"}\n')
    await writeFile(path.join(source, 'status-badge.json'), '{"name":"status-badge"}\n')
    await writeFile(path.join(publicRoot, 'r/stale.json'), '{}\n')
    await writeFile(path.join(publicRoot, 'llms.txt'), 'keep me\n')

    await stageRegistry(repoRoot)

    await expect(readFile(path.join(publicRoot, 'r/status-badge.json'), 'utf8')).resolves.toContain(
      'status-badge',
    )
    await expect(readFile(path.join(publicRoot, 'r/stale.json'), 'utf8')).rejects.toThrow()
    await expect(readFile(path.join(publicRoot, 'llms.txt'), 'utf8')).resolves.toBe('keep me\n')
  })
})
