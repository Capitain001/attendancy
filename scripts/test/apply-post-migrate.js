import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(dirname, '../..')

for (const line of readFileSync(resolve(rootDir, '.env'), 'utf-8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...rest] = trimmed.split('=')
  if (key && rest.length) process.env[key] = rest.join('=').replace(/^["']|["']$/g, '')
}

if (!process.env.TEST_DATABASE_URL) { console.error('❌ TEST_DATABASE_URL missing'); process.exit(1) }

const directUrl = process.env.TEST_DIRECT_URL ?? process.env.TEST_DATABASE_URL.replace(/-pooler\./, '.')
process.env.DIRECT_URL = directUrl
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL

console.log('→ Applying post-migrate SQL to test DB...')

const postMigrateDir = resolve(rootDir, 'prisma/post-migrate')
if (!existsSync(postMigrateDir)) { console.error('❌ prisma/post-migrate/ not found'); process.exit(1) }

const sqlFiles = readdirSync(postMigrateDir, { recursive: true })
  .filter(f => String(f).endsWith('.sql'))
  .sort()

for (const file of sqlFiles) {
  const path = join(postMigrateDir, String(file))
  console.log(`→ ${file}`)
  execSync(`npx prisma db execute --file "${path}"`, { stdio: 'inherit', env: process.env })
}

console.log('\n✅ Post-migrate SQL applied!')
