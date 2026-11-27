// packages/chat/tests/global-setup.ts
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export default function setup() {
  if (process.env.CHAT_RELAY_BIN) return
  const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..')
  const r = spawnSync('cargo', ['build', '-p', 'chat-relay'], { cwd: root, stdio: 'inherit' })
  if (r.error || r.status !== 0) {
    throw new Error(`cargo build -p chat-relay a échoué (${r.error?.message ?? `code ${r.status}`})`)
  }
}
