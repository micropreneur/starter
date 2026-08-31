import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { openSync } from 'fontkit'
import sharp from 'sharp'

import { siteConfig } from '../site.config.mjs'

const WIDTH = 1200
const HEIGHT = 630
const committedDirectory = fileURLToPath(new URL('../public/og/', import.meta.url))

const fonts = {
  mono: openFont('@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2'),
  sans: openFont('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'),
  serif: openFont('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2'),
}

const copy = { ...siteConfig.socialImage, title: siteConfig.name }

if (process.argv.includes('--verify')) {
  await verifyCommittedImage()
} else {
  await buildImage(committedDirectory)
  console.log('Generated public/og/starter.svg and public/og/starter.png')
}

async function buildImage(directory) {
  const svg = renderSvg()
  if (/<text(?:\s|>)/u.test(svg)) {
    throw new Error('The generated social image contains host-rendered SVG text.')
  }

  const png = await sharp(Buffer.from(svg))
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()

  await Promise.all([
    writeFile(join(directory, 'starter.svg'), svg),
    writeFile(join(directory, 'starter.png'), png),
  ])
}

async function verifyCommittedImage() {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'micropreneur-og-'))

  try {
    await buildImage(temporaryDirectory)

    const [generatedSvg, generatedPng, committedSvg, committedPng] = await Promise.all([
      readFile(join(temporaryDirectory, 'starter.svg')),
      readFile(join(temporaryDirectory, 'starter.png')),
      readFile(join(committedDirectory, 'starter.svg')),
      readFile(join(committedDirectory, 'starter.png')),
    ])

    if (!generatedSvg.equals(committedSvg) || !generatedPng.equals(committedPng)) {
      throw new Error(
        'Committed social assets are stale. Run `pnpm --filter web og:build` and commit both files.',
      )
    }

    const metadata = await sharp(generatedPng).metadata()
    if (metadata.format !== 'png' || metadata.width !== WIDTH || metadata.height !== HEIGHT) {
      throw new Error(
        `Expected a ${WIDTH}x${HEIGHT} PNG, received ${metadata.width}x${metadata.height} ${metadata.format}.`,
      )
    }

    console.log(
      `Verified deterministic ${WIDTH}x${HEIGHT} PNG (${sha256(generatedPng).slice(0, 16)}).`,
    )
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

function renderSvg() {
  const eyebrow = outlineText({
    baseline: 111,
    fill: '#262b32',
    font: fonts.mono,
    fontSize: 20,
    letterSpacing: 3,
    text: copy.eyebrow,
    x: 128,
  })
  const title = outlineText({
    baseline: 284,
    fill: '#262b32',
    font: fonts.serif,
    fontSize: 78,
    letterSpacing: -2,
    text: copy.title,
    x: 104,
  })
  const tagline = outlineText({
    baseline: 360,
    fill: '#5f6670',
    font: fonts.sans,
    fontSize: 34,
    text: copy.tagline,
    x: 104,
  })
  const stack = [
    outlineText({
      baseline: 430,
      fill: '#5f6670',
      font: fonts.mono,
      fontSize: 18,
      text: copy.stack[0],
      x: 104,
    }),
    outlineText({
      baseline: 430,
      fill: '#5f6670',
      font: fonts.mono,
      fontSize: 18,
      text: copy.stack[1],
      x: 334,
    }),
    outlineText({
      baseline: 430,
      fill: '#5f6670',
      font: fonts.mono,
      fontSize: 18,
      text: copy.stack[2],
      x: 513,
    }),
  ].join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(copy.title)}</title>
  <desc id="description">${escapeXml(copy.description)}</desc>
  <rect width="1200" height="630" fill="#ffffff"/>
  <g stroke="#ddd4c7" fill="none">
    <path d="M0 72.5h1200M0 557.5h1200"/>
    <path d="M72.5 0v630M1127.5 0v630"/>
    <path opacity=".5" d="M72 170h1056M72 460h1056"/>
  </g>
  <rect x="72" y="72" width="1056" height="486" rx="24" fill="#fcfbf8" stroke="#ddd4c7"/>
  <circle cx="104" cy="104" r="7" fill="#d15a24"/>
${eyebrow}
${title}
${tagline}
${stack}
  <circle cx="310" cy="424" r="4" fill="#d15a24"/>
  <circle cx="489" cy="424" r="4" fill="#d15a24"/>
  <circle cx="1090" cy="510" r="6" fill="#d15a24"/>
</svg>
`
}

function outlineText({ baseline, fill, font, fontSize, letterSpacing = 0, text, x }) {
  const run = font.layout(text)
  const scale = fontSize / font.unitsPerEm
  let cursor = x
  const paths = []

  for (const [index, glyph] of run.glyphs.entries()) {
    const position = run.positions[index]
    if (!position) throw new Error(`Missing position for glyph ${index} in "${text}".`)

    const path = glyph.path.toSVG()
    if (path) {
      const glyphX = cursor + position.xOffset * scale
      const glyphY = baseline - position.yOffset * scale
      paths.push(
        `    <path d="${path}" transform="translate(${format(glyphX)} ${format(glyphY)}) scale(${format(scale)} ${format(-scale)})"/>`,
      )
    }

    cursor += position.xAdvance * scale
    if (index < run.glyphs.length - 1) cursor += letterSpacing
  }

  return `  <g fill="${fill}">\n${paths.join('\n')}\n  </g>`
}

function openFont(specifier) {
  return openSync(fileURLToPath(import.meta.resolve(specifier)))
}

function format(value) {
  return Number(value.toFixed(6)).toString()
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
