import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const source = new URL('../public/og/starter.svg', import.meta.url)
const output = new URL('../public/og/starter.png', import.meta.url)
const svg = await readFile(source)

await sharp(svg)
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9, palette: false })
  .toFile(fileURLToPath(output))

console.log('Generated public/og/starter.png from public/og/starter.svg')
