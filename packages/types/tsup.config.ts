import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { contract: './src/index.ts' },
  tsconfig: './tsconfig.dts.json',
  dts: { only: true },
  format: ['esm'],
  clean: true,
  external: [/^@\/generated\/prisma/, /^@prisma\/client/],
})