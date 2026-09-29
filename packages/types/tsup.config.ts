import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { contract: '../../apps/web/src/app/api/rpc/[action]/contract.ts' },
  tsconfig: './tsconfig.dts.json',
  dts: { only: true },
  format: ['esm'],
  clean: true,
})
