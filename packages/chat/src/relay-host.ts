//packages\chat\src\relay-host.ts
// Entrée séparée (Node / tests) : lance et arrête le binaire chat-relay (en Tauri, le relais est embarqué comme bibliothèque Rust).
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
  | 'StoppedDuringStart' // stop() appelé pendant que start() attendait LISTENING
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

// Codes émis par chat-relay sur stderr, ligne `ERROR <code>` (hub.rs + main.rs)
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

const TAIL_MAX = 2000
const noop = () => {}
const hasExited = (c: ChildProcess) => c.exitCode !== null || c.signalCode !== null
const waitExit = (c: ChildProcess) =>
  new Promise<void>((ok) => (hasExited(c) ? ok() : void c.once('exit', () => ok())))

// Découpe un flux en lignes, un tampon par flux (stdout et stderr ne se mélangent pas)
function lineReader(onLine: (line: string) => void) {
  let buf = ''
  return (d: Buffer) => {
    buf += String(d)
    let nl: number
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      onLine(line)
    }
  }
}

function validate(o: RelayHostOptions) {
  const bad = (d: string) => new RelayHostError('BadOptions', d)
  if (!o.token) throw bad('token vide')
  if (o.port != null && !(Number.isInteger(o.port) && o.port >= 0 && o.port <= 65535)) {
    throw bad(`port invalide: ${o.port}`)
  }
  if (o.maxConnections != null && !(Number.isInteger(o.maxConnections) && o.maxConnections > 0)) {
    throw bad(`maxConnections invalide: ${o.maxConnections}`)
  }
  if (o.hostUserId && o.members) {
    const present = Object.values(o.members).some((users) => users.includes(o.hostUserId!))
    if (!present) throw new RelayHostError('HostNotInMembers', o.hostUserId)
  }
}

export function createRelayHost(config: RelayHostConfig = {}) {
  const startTimeoutMs = config.startTimeoutMs ?? 5000
  const stopTimeoutMs = config.stopTimeoutMs ?? 3000

  let proc: ChildProcess | null = null
  let starting = false
  let info: RunningRelay | null = null
  let tempDir: string | null = null
  let membersPath: string | null = null
  let stopping: Promise<void> | null = null
  // Fin du dernier start() (réussi ou non) : stop() l'attend pour ne pas laisser d'état à moitié nettoyé
  let startSettled: Promise<void> = Promise.resolve()

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
    membersPath = null
    if (o.members) {
      tempDir = mkdtempSync(join(tmpdir(), 'chat-relay-')) // dossier créé en 0700 sous POSIX
      membersPath = join(tempDir, 'members.json')
      writeFileSync(membersPath, JSON.stringify(o.members), { encoding: 'utf8', mode: 0o600 })
      args.push('--members', membersPath)
    }
    if (o.maxConnections != null) args.push('--max-connections', String(o.maxConnections))
    if (o.extraArgs) args.push(...o.extraArgs)
    return args
  }

  async function launch(o: RelayHostOptions, bin: string): Promise<RunningRelay> {
    let child: ChildProcess
    try {
      child = spawn(bin, buildArgs(o), { stdio: ['pipe', 'pipe', 'pipe'] })
    } catch (e) {
      cleanupTemp()
      starting = false
      throw new RelayHostError('StartFailed', e instanceof Error ? e.message : String(e))
    }
    // Le relais peut être déjà mort quand stop() ferme stdin : EPIPE ne doit pas remonter
    child.stdin!.on('error', noop)
    proc = child

    let tail = '' // dernières sorties stderr, pour diagnostiquer une sortie prématurée
    const onTail = (d: Buffer) => {
      tail = (tail + String(d)).slice(-TAIL_MAX)
    }
    let detach = noop

    try {
      const running = await new Promise<RunningRelay>((ok, ko) => {
        const timer = setTimeout(
          () => ko(new RelayHostError('StartTimeout', `${startTimeoutMs} ms`)),
          startTimeoutMs,
        )
        const onOut = lineReader((line) => {
          const l = /^LISTENING (.+):(\d+)$/.exec(line)
          if (l) {
            const urlHost = l[1] === '0.0.0.0' ? '127.0.0.1' : l[1]!
            ok({ host: l[1]!, port: Number(l[2]), url: `ws://${urlHost}:${l[2]}` })
          }
        })
        const onErr = lineReader((line) => {
          const e = /^ERROR ([a-z_]+):\s*(.*)$/.exec(line)
          if (e) ko(new RelayHostError(RELAY_ERRORS[e[1]!] ?? 'RelayError', e[2] || e[1]))
        })
        const onError = (err: Error) => ko(new RelayHostError('ExitedEarly', err.message))
        // `close` (et non `exit`) : émis une fois stdout/stderr vidés, donc la ligne ERROR est déjà lue
        const onClose = (code: number | null) =>
          ko(new RelayHostError('ExitedEarly', `code ${code}${tail.trim() ? ` : ${tail.trim()}` : ''}`))

        child.stdout!.on('data', onOut)
        child.stderr!.on('data', onErr)
        child.stderr!.on('data', onTail)
        child.once('error', onError)
        child.once('close', onClose)
        detach = () => {
          clearTimeout(timer)
          child.stdout!.off('data', onOut)
          child.stderr!.off('data', onErr)
          child.stderr!.off('data', onTail)
          child.off('error', onError)
          child.off('close', onClose)
          // Drain : sans lecteur, un pipe plein bloquerait le relais
          child.stdout!.resume()
          child.stderr!.resume()
        }
      })
      detach()
      if (proc !== child) throw new RelayHostError('StoppedDuringStart')
      if (hasExited(child)) throw new RelayHostError('ExitedEarly', 'mort juste après LISTENING')
      // Après le démarrage : si le process meurt seul, on libère l'état
      child.once('exit', () => {
        if (proc === child) {
          proc = null
          info = null
          cleanupTemp()
        }
      })
      info = running
      cleanupTemp() // le relais a déjà lu --members avant d'écrire LISTENING
      starting = false
      return running
    } catch (e) {
      detach()
      const cancelled = proc !== child // stop() a pris la main pendant l'attente
      if (proc === child) proc = null
      child.kill()
      await waitExit(child) // le port est libéré avant de rendre la main
      cleanupTemp()
      starting = false
      throw cancelled && !(e instanceof RelayHostError && e.code === 'StoppedDuringStart')
        ? new RelayHostError('StoppedDuringStart')
        : e
    }
  }

  async function start(o: RelayHostOptions): Promise<RunningRelay> {
    if (stopping) await stopping
    if (proc || starting) throw new RelayHostError('AlreadyStarted')
    validate(o)
    const bin = config.bin ?? defaultRelayBin()
    if (!existsSync(bin)) throw new RelayHostError('BinaryNotFound', bin)
    starting = true // posé avant tout await : deux start() simultanés → un seul passe
    const run = launch(o, bin)
    startSettled = run.then(noop, noop)
    return run
  }

  // Idempotent. Fermer stdin déclenche l'arrêt propre ; SIGKILL en dernier recours.
  async function stop() {
    if (stopping) return stopping
    stopping = (async () => {
      const child = proc
      if (child) {
        proc = null
        info = null
        const exited = waitExit(child)
        child.stdin?.end()
        const timer = setTimeout(() => child.kill('SIGKILL'), stopTimeoutMs)
        await exited
        clearTimeout(timer)
      }
      await startSettled // un start() en cours a fini son propre nettoyage
      cleanupTemp()
    })().finally(() => {
      stopping = null
    })
    return stopping
  }

  return {
    start,
    stop,
    get running() {
      return proc !== null && !starting
    },
    get info() {
      return info
    },
    get pid() {
      return proc?.pid
    },
    // Dernier chemin utilisé pour les membres (déjà supprimé une fois LISTENING émis)
    get membersFile() {
      return membersPath
    },
  }
}

export type RelayHost = ReturnType<typeof createRelayHost>
