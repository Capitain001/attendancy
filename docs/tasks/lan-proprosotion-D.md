# Étape D : `relay-host.ts`, contrats et branchement E2E

## 1. `package.json` : export Node séparé

`relay-host.ts` importe `node:child_process`, donc il ne doit pas passer par `index.ts` (navigateur/Tauri).

```diff
   "exports": {
     ".": "./src/index.ts",
-    "./idb": "./src/idb-store.ts"
+    "./idb": "./src/idb-store.ts",
+    "./relay-host": "./src/relay-host.ts"
   },
```

## 2. `src/relay-host.ts` (nouveau)

```ts
//packages\chat\src\relay-host.ts
// Entrée séparée (Node/Tauri sidecar) : lance et arrête le binaire chat-relay.
import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type RelayHostErrorCode =
  | 'HostNotInMembers'
  | 'AlreadyStarted'
  | 'BinaryNotFound'
  | 'PortInUse'
  | 'PermissionDenied'
  | 'AddressNotAvailable'
  | 'BadOptions'
  | 'StartFailed'
  | 'ExitedEarly'
  | 'StartTimeout'
  | 'RelayError' // ERROR <code> inconnu : le code brut est dans `detail`

export class RelayHostError extends Error {
  constructor(
    public readonly code: RelayHostErrorCode,
    public readonly detail?: string,
  ) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'RelayHostError'
  }
}

// Codes émis par chat-relay sur la ligne `ERROR <code>` (hub.rs + main.rs)
const RELAY_ERRORS: Record<string, RelayHostErrorCode> = {
  port_in_use: 'PortInUse',
  permission_denied: 'PermissionDenied',
  address_unavailable: 'AddressNotAvailable',
  start_failed: 'StartFailed',
  bad_options: 'BadOptions',
}

export type RelayHostOptions = {
  token: string
  hostUserId?: string
  members?: Record<string, string[]>
  port?: number // 0 = port libre (défaut)
  bind?: string // défaut 127.0.0.1
  maxConnections?: number
  extraArgs?: string[] // ex. ['--rate-burst', '2'] pour les tests de débit
}

export type RunningRelay = { url: string; host: string; port: number }

export type RelayHostConfig = {
  bin?: string
  startTimeoutMs?: number
  stopTimeoutMs?: number
}

export function defaultRelayBin() {
  return (
    process.env.CHAT_RELAY_BIN ??
    resolve(
      fileURLToPath(new URL('.', import.meta.url)),
      '../../../target/debug',
      process.platform === 'win32' ? 'chat-relay.exe' : 'chat-relay',
    )
  )
}

export function createRelayHost(config: RelayHostConfig = {}) {
  const startTimeoutMs = config.startTimeoutMs ?? 5000
  const stopTimeoutMs = config.stopTimeoutMs ?? 3000

  let proc: ChildProcess | null = null
  let starting = false
  let info: RunningRelay | null = null
  let tempDir: string | null = null

  function cleanupTemp() {
    if (!tempDir) return
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
    tempDir = null
  }

  function buildArgs(o: RelayHostOptions) {
    const args = [
      '--token', o.token,
      '--bind', o.bind ?? '127.0.0.1',
      '--port', String(o.port ?? 0),
      '--stop-on-stdin-eof', // arrêt propre aussi sous Windows (pas de SIGINT)
    ]
    if (o.hostUserId) args.push('--host-user', o.hostUserId)
    if (o.members) {
      tempDir = mkdtempSync(join(tmpdir(), 'chat-relay-'))
      const membersPath = join(tempDir, 'members.json')
      writeFileSync(membersPath, JSON.stringify(o.members), 'utf8')
      args.push('--members', membersPath)
    }
    if (o.maxConnections != null) args.push('--max-connections', String(o.maxConnections))
    if (o.extraArgs) args.push(...o.extraArgs)
    return args
  }

  async function start(o: RelayHostOptions): Promise<RunningRelay> {
    if (proc || starting) throw new RelayHostError('AlreadyStarted')
    if (o.hostUserId && o.members) {
      const present = Object.values(o.members).some((users) => users.includes(o.hostUserId!))
      if (!present) {
        throw new RelayHostError('HostNotInMembers', o.hostUserId)
      }
    }
    const bin = config.bin ?? defaultRelayBin()
    if (!existsSync(bin)) throw new RelayHostError('BinaryNotFound', bin)

    starting = true
    const child = spawn(bin, buildArgs(o), { stdio: ['pipe', 'pipe', 'pipe'] })
    proc = child
    try {
      info = await new Promise<RunningRelay>((ok, ko) => {
        let buf = ''
        const timer = setTimeout(
          () => ko(new RelayHostError('StartTimeout', `${startTimeoutMs} ms`)),
          startTimeoutMs,
        )
        const onData = (d: Buffer) => {
          buf += String(d)
          let nl: number
          while ((nl = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, nl).trim()
            buf = buf.slice(nl + 1)
            const l = /^LISTENING (.+):(\d+)$/.exec(line)
            if (l) {
              clearTimeout(timer)
              return ok({ host: l[1]!, port: Number(l[2]), url: `ws://${l[1]}:${l[2]}` })
            }
            const e = /^ERROR (\S+)/.exec(line)
            if (e) {
              clearTimeout(timer)
              return ko(new RelayHostError(RELAY_ERRORS[e[1]!] ?? 'RelayError', e[1]))
            }
          }
        }
        child.stdout!.on('data', onData)
        child.stderr!.on('data', onData)
        child.once('error', (err) => {
          clearTimeout(timer)
          ko(new RelayHostError('ExitedEarly', err.message))
        })
        child.once('exit', (code) => {
          clearTimeout(timer)
          ko(new RelayHostError('ExitedEarly', `code ${code}`))
        })
      })
    } catch (e) {
      if (proc === child) proc = null
      child.kill()
      cleanupTemp()
      starting = false
      throw e
    }
    // Après le démarrage : si le process meurt seul, on libère l'état
    child.once('exit', () => {
      if (proc === child) {
        proc = null
        info = null
        cleanupTemp()
      }
    })
    starting = false
    return info
  }

  // Idempotent. Fermer stdin déclenche l'arrêt propre ; SIGKILL en dernier recours.
  async function stop() {
    const child = proc
    if (!child) {
      cleanupTemp()
      return
    }
    proc = null
    info = null
    const exited = new Promise<void>((ok) =>
      child.exitCode !== null || child.signalCode ? ok() : child.once('exit', () => ok()),
    )
    child.stdin?.end()
    const timer = setTimeout(() => child.kill('SIGKILL'), stopTimeoutMs)
    await exited
    clearTimeout(timer)
    cleanupTemp()
  }

  return {
    start,
    stop,
    get running() {
      return proc !== null
    },
    get info() {
      return info
    },
  }
}

export type RelayHost = ReturnType<typeof createRelayHost>
```

## 3. `tests/host.contract.test.ts` (nouveau)

```ts
//packages\chat\tests\host.contract.test.ts
import { createServer } from 'node:net'
import WebSocket from 'ws'
import { afterEach, describe, expect, it } from 'vitest'
import { createRelayHost, RelayHostError } from '../src/relay-host'

const CHANNEL = '11111111-1111-4111-8111-111111111111'
const hosts: ReturnType<typeof createRelayHost>[] = []
const mk = () => {
  const h = createRelayHost()
  hosts.push(h)
  return h
}
afterEach(async () => {
  await Promise.all(hosts.splice(0).map((h) => h.stop()))
})

const code = (p: Promise<unknown>) =>
  p.then(
    () => null,
    (e) => (e instanceof RelayHostError ? e.code : e),
  )

function handshake(url: string) {
  return new Promise<string>((ok, ko) => {
    const ws = new WebSocket(url)
    ws.once('error', ko)
    ws.once('open', () =>
      ws.send(JSON.stringify({ t: 'hello', token: 'tok', userId: 'a', channels: [CHANNEL], known: [] })),
    )
    ws.once('message', (d) => {
      ws.close()
      ok(String(JSON.parse(String(d)).t))
    })
  })
}

describe('hostContract', () => {
  it('écoute sur un port réel et répond au hello', async () => {
    const h = mk()
    const { port, url } = await h.start({ token: 'tok' })
    expect(port).toBeGreaterThan(0)
    expect(h.running).toBe(true)
    expect(await handshake(url)).toBe('welcome')
  })

  it('stop() puis start() est autorisé', async () => {
    const h = mk()
    await h.start({ token: 'tok' })
    await h.stop()
    expect(h.running).toBe(false)
    const again = await h.start({ token: 'tok' })
    expect(await handshake(again.url)).toBe('welcome')
  })

  it('stop() est idempotent, même sans start()', async () => {
    const h = mk()
    await h.stop()
    await h.start({ token: 'tok' })
    await h.stop()
    await h.stop()
    expect(h.running).toBe(false)
  })

  it('second start() actif : AlreadyStarted', async () => {
    const h = mk()
    await h.start({ token: 'tok' })
    expect(await code(h.start({ token: 'tok' }))).toBe('AlreadyStarted')
    expect(h.running).toBe(true)
  })

  it('hostUserId absent de members : HostNotInMembers, rien n’est lancé', async () => {
    const h = mk()
    expect(await code(h.start({ token: 'tok', hostUserId: 'prof', members: { [CHANNEL]: ['eleve'] } }))).toBe(
      'HostNotInMembers',
    )
    expect(h.running).toBe(false)
  })

  it('hostUserId présent dans members : démarre', async () => {
    const h = mk()
    await h.start({ token: 'tok', hostUserId: 'prof', members: { [CHANNEL]: ['prof', 'eleve'] } })
    expect(h.running).toBe(true)
  })

  it('port occupé : erreur typée, état propre, redémarrage possible', async () => {
    const blocker = createServer()
    await new Promise<void>((ok) => blocker.listen(0, '127.0.0.1', () => ok()))
    const busy = (blocker.address() as { port: number }).port
    try {
      const h = mk()
      expect(await code(h.start({ token: 'tok', port: busy }))).toBe('PortInUse')
      expect(h.running).toBe(false)
      await h.start({ token: 'tok' }) // port libre : ça repart
      expect(h.running).toBe(true)
    } finally {
      await new Promise((ok) => blocker.close(ok))
    }
  })
})
```

## 4. Branchement des E2E existants

**`relay.e2e.test.ts`** : remplace `spawn`/`BIN`/`existsSync`, et la fonction locale `spawnHub`.

```diff
-import { type ChildProcess, spawn } from "node:child_process";
-import { existsSync } from "node:fs";
-import { resolve } from "node:path";
 import WebSocket from "ws";
 import { afterAll, beforeAll, describe, expect, it } from "vitest";
 import { createChatSync, ... } from "../src";
+import { createRelayHost } from "../src/relay-host";

-const BIN = resolve(...);
 const WS = WebSocket as unknown as WebSocketCtor;
 const TEST_CHANNEL = "...";

-let hub: ChildProcess;
+const hub = createRelayHost();
 let url = "";

 beforeAll(async () => {
-  if (!existsSync(BIN)) throw ...
-  hub = spawn(BIN, [...]);
-  url = await new Promise<string>(...);
+  url = (await hub.start({ token: "tok" })).url;
 });
-afterAll(() => hub?.kill());
+afterAll(() => hub.stop());
```

Test « le hub tombe puis revient » : un hôte dédié, même port au redémarrage.

```diff
-    const spawnHub = (port: string) => { ... };
-    const first = await spawnHub("0");
+    const host = createRelayHost();
+    const first = await host.start({ token: "tok" });
     const saved = url;
-    url = `ws://127.0.0.1:${first.port}`;
+    url = first.url;
 ...
-    first.proc.kill();
+    await host.stop();
 ...
-    const second = await spawnHub(first.port);
+    await host.start({ token: "tok", port: first.port });
 ...
-    second.proc.kill();
+    await host.stop();
     url = saved;
```

**`relay.limits.e2e.test.ts`** : seul le helper `relay()` change. `extraArgs` couvre `--rate-*` et `--host-user` passe par l'option dédiée.

```diff
-import { type ChildProcess, spawn } from 'node:child_process'
-import { existsSync } from 'node:fs'
-import { resolve } from 'node:path'
+import { createRelayHost } from '../src/relay-host'
 ...
-const BIN = ...
-const procs: ChildProcess[] = []
+const hosts: ReturnType<typeof createRelayHost>[] = []
 const transports: { stop(): void }[] = []
-afterEach(() => {
+afterEach(async () => {
   transports.splice(0).forEach((t) => t.stop())
-  procs.splice(0).forEach((p) => p.kill())
+  await Promise.all(hosts.splice(0).map((h) => h.stop()))
 })

-async function relay(...args: string[]) {
-  ...spawn...
-}
+async function relay(o: { hostUserId?: string; extraArgs?: string[] } = {}) {
+  const host = createRelayHost()
+  hosts.push(host)
+  const { url } = await host.start({ token: 'tok', ...o })
+  return { url }
+}
```

Et aux appels :

```diff
-await relay('--rate-burst', '2', '--rate-per-sec', '10')
+await relay({ extraArgs: ['--rate-burst', '2', '--rate-per-sec', '10'] })
-await relay('--host-user', 'prof')
+await relay({ hostUserId: 'prof' })
```

Le test SIGINT a besoin du `proc` brut et du signal, que `relay-host` ne fait pas (arrêt via stdin). Garde son `spawn` local dans ce test, avec `existsSync`/`resolve` importés pour lui seul, ou extrais `defaultRelayBin()` depuis `relay-host` pour le BIN.

## Points à noter

- **Vérifier le flag `--stop-on-stdin-eof`.** `stop()` ferme `stdin` puis attend la sortie, avec SIGKILL après `stopTimeoutMs` en dernier recours.
- **Le test « port occupé »** suppose que le relais écrit `ERROR <code>` sur stdout ou stderr (les deux sont lus). S'il sort simplement avec un code non nul sans cette ligne, l'erreur sera `ExitedEarly` et il faudra ajuster l'assertion.
- **`global-setup.ts` reste inchangé.** Il compile déjà le binaire, et `CHAT_RELAY_BIN` est pris en compte par `defaultRelayBin()`.