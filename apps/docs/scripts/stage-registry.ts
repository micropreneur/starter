import { cp, mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export async function stageRegistry(repoRoot: string) {
  const source = path.join(repoRoot, 'packages/elements/dist/r')
  const publicRoot = path.join(repoRoot, 'apps/docs/public')
  const target = path.join(publicRoot, 'r')

  if (path.dirname(target) !== publicRoot) {
    throw new Error(`Refusing to stage the registry outside ${publicRoot}.`)
  }

  await readFile(path.join(source, 'registry.json'), 'utf8')
  await mkdir(publicRoot, { recursive: true })
  await rm(target, { force: true, recursive: true })
  await cp(source, target, { recursive: true })

  return target
}

async function main() {
  const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
  const target = await stageRegistry(repoRoot)
  process.stdout.write(`Staged Elements Free registry at ${path.relative(repoRoot, target)}.\n`)
}

const entryPoint = process.argv[1]
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main()
}
