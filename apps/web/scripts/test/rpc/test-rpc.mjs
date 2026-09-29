// scripts/test-rpc.mjs
// Lancer : node --env-file=.env.local scripts/test-rpc.mjs
const {
  NEXT_PUBLIC_SUPABASE_URL: SB,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON,
  TEST_EMAIL,
  TEST_PASSWORD,
} = process.env
const API = process.env.API_URL ?? 'http://localhost:3000'
const ACTION = process.env.RPC_ACTION ?? 'getSchedulesAction'
const BODY = process.env.RPC_BODY ?? '{}'

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))


async function login() {
  const res = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Login échoué : ${body.msg ?? body.error_description ?? res.status}`)
  return body.access_token
}

async function call(action, token) {
  const res = await fetch(`${API}/api/rpc/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: BODY,
  })
  return { status: res.status, text: (await res.text()) }
}

const token = await login()
const [head, payload, sig] = token.split('.')
// on altère un caractère au milieu de la signature (pas le dernier, ses bits de bourrage peuvent être ignorés)
const forged = `${head}.${payload}.${sig.slice(0, 10)}${sig[10] === 'A' ? 'B' : 'A'}${sig.slice(11)}`

const cases = [
  ['Token valide',          ACTION,            token,  200],
  ['Signature altérée',     ACTION,            forged, 401],
  ['Sans en-tête',          ACTION,            null,   401],
  ['Action inconnue',       'actionInexistante', token, 404],
]

for (const [label, action, tok, expected] of cases) {
  const { status, text } = await call(action, tok)
  const ok = status === expected ? 'OK  ' : 'FAIL'
  console.log(`${ok} ${label.padEnd(20)} attendu ${expected}, reçu ${status}  ${text}`)
}


const outputLines = []

for (const [label, action, tok, expected] of cases) {
  const { status, text } = await call(action, tok)
  const ok = status === expected ? 'OK  ' : 'FAIL'
  const line = `${ok} ${label.padEnd(20)} attendu ${expected}, reçu ${status}  ${text}`
  
  console.log(line)
  outputLines.push(line)
}

writeFileSync(join(__dirname, 'result.txt'), outputLines.join('\n'), 'utf-8')