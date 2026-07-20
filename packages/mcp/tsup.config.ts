import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/server.ts', 'src/stdio.ts'],
  format: ['esm'],
  noExternal: ['@micropreneur/elements'],
  platform: 'node',
  sourcemap: true,
  splitting: false,
  target: 'node22',
})
