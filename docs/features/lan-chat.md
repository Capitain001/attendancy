# Intégration du Chat LAN (Offline / Pair-à-pair)

Ce document décrit l'architecture et l'implémentation de l'interface LAN (rejoindre ou héberger une séance locale par QR code / lien `attendancy://chat?...`) ainsi que son branchement dans `apps/chat`.

---

## Prérequis & Dépendances

1. **Dépendance `qrcode.react`** (utilisée par `HostLan.tsx`) :
   ```bash
   bun add --cwd packages/ui qrcode.react
   ```
2. **Exposer `lan` dans `ChatSyncProvider`** (`apps/web/src/modules/chat/ChatSyncProvider.tsx`) :
   `LanPanel.tsx` consomme `sync.lan` (`{ status: TransportStatus; failure: string | null; pairing: Pairing | null }`). Il faut ajouter cet état au contexte retourné par `ChatSyncProvider`.

---

## Arborescence cible

```text
packages/ui/src/components/chat/
├── useDelayedFlag.ts
└── lan/
    ├── lan-status.ts
    ├── QrScanner.tsx
    ├── JoinLan.tsx
    └── HostLan.tsx

apps/web/src/modules/chat/lan/
├── useSyncCounts.ts
└── LanPanel.tsx

apps/chat/src/routes/_app/
└── local.tsx
```

---

## 1. Hook utilitaire partagé (`packages/ui`)

### `packages/ui/src/components/chat/useDelayedFlag.ts`

```ts
'use client'

import { useEffect, useState } from 'react'

// Vrai seulement si `flag` dure au moins `ms` : évite d'annoncer un état transitoire
// (« Hors ligne » pendant la connexion initiale, « connexion impossible » après une seconde).
export function useDelayedFlag(flag: boolean, ms: number) {
  const [elapsed, setElapsed] = useState(false)
  useEffect(() => {
    if (!flag) return
    const timer = setTimeout(() => setElapsed(true), ms)
    return () => {
      clearTimeout(timer)
      setElapsed(false)
    }
  }, [flag, ms])
  return flag && elapsed
}
```

---

## 2. Logique pure & UI LAN (`packages/ui/src/components/chat/lan/`)

### `packages/ui/src/components/chat/lan/lan-status.ts`

```ts
// Présentation de l'état du réseau local : fonctions pures, testables sans React.
import { decodePairing, type TransportStatus } from '@attendancy/chat'

export type LanTone = 'off' | 'wait' | 'on' | 'error'
export type LanView = { label: string; detail?: string; tone: LanTone }

// Raisons de refus : celles du hub (bad_token, not_member, bad_hello) et celles
// que le transport détecte lui-même (navigateur qui bloque ws:// depuis une page https).
const FAILURES: Record<string, string> = {
  bad_token: "Le code n'est plus valide. Demandez à l'enseignant d'afficher le code actuel.",
  not_member: "Vous n'avez pas accès à cette séance.",
  bad_hello: "Le serveur local n'a pas compris la connexion. Mettez l'application à jour.",
  insecure_context:
    "Ce navigateur bloque les connexions locales depuis une page sécurisée (https). Utilisez l'application installée.",
  unsupported: "Ce navigateur ne permet pas les connexions locales.",
}

export function describeLan(status: TransportStatus, failure: string | null): LanView {
  if (failure) {
    return {
      label: 'Connexion refusée',
      detail: FAILURES[failure] ?? 'Le serveur local a refusé la connexion.',
      tone: 'error',
    }
  }
  switch (status) {
    case 'connected':
      return { label: 'Connecté au réseau local', tone: 'on' }
    case 'connecting':
      return { label: 'Connexion en cours…', tone: 'wait' }
    default:
      return { label: 'Non connecté', tone: 'off' }
  }
}

// Lien collé ou lu depuis un QR : espaces et retours à la ligne autour sont ignorés
export const parsePairingInput = (raw: string) => decodePairing(raw.trim())

export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

// Jeton de séance : 128 bits aléatoires, en base64url (22 caractères)
export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
```

### `packages/ui/src/components/chat/lan/QrScanner.tsx`

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import { typography } from '../../../styles/ui'

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> }
type DetectorCtor = new (options: { formats: string[] }) => Detector

const SCAN_INTERVAL_MS = 200

// BarcodeDetector n'existe pas partout (Chrome et Edge sur Android surtout). Sans lui, le collage
// du lien reste disponible : ne jamais en faire le seul chemin d'appairage.
export const canScanQr = () =>
  typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia

interface QrScannerProps {
  // Reçoit le texte lu ; retourne true s'il est accepté. Sinon la lecture continue.
  onResult: (text: string) => boolean
  onCancel: () => void
}

export function QrScanner({ onResult, onCancel }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  const resultRef = useRef(onResult)
  useEffect(() => {
    resultRef.current = onResult
  })

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let stream: MediaStream | undefined

    async function run() {
      try {
        const Detector = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector
        const detector = new Detector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped) return stream.getTracks().forEach((t) => t.stop())

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const tick = async () => {
          if (stopped) return
          try {
            const [code] = await detector.detect(video)
            if (code?.rawValue && resultRef.current(code.rawValue)) return // accepté : le parent ferme le scanner
          } catch {
            // image non décodable : on réessaie à la suivante
          }
          timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS)
        }
        void tick()
      } catch (e) {
        setError(
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? "L'accès à la caméra est refusé. Autorisez-le dans les réglages, ou collez le lien."
            : "Impossible d'ouvrir la caméra. Collez le lien de la séance à la place.",
        )
      }
    }
    void run()

    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className={cn(typography.small, 'text-destructive')}>
          {error}
        </p>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Aperçu de la caméra pour lire le code"
          className="aspect-square w-full max-w-sm rounded-[var(--radius)] border border-border bg-card object-cover"
        />
      )}
      <button
        type="button"
        onClick={onCancel}
        className={cn(typography.small, 'self-start rounded-md px-2 py-1 text-foreground/70 hover:bg-secondary')}
      >
        Annuler
      </button>
    </div>
  )
}
```

### `packages/ui/src/components/chat/lan/JoinLan.tsx`

```tsx
'use client'

import { useCallback, useState, type FormEvent } from 'react'
import type { Pairing } from '@attendancy/chat'
import { cn } from '../../../lib/utils'
import { button, typography } from '../../../styles/ui'
import { chat } from '../../../styles/ui/chat'
import { parsePairingInput } from './lan-status'
import { canScanQr, QrScanner } from './QrScanner'

const INVALID =
  "Ce code n'est pas celui d'une séance locale. Scannez le code affiché par l'enseignant, ou collez son lien."

export function JoinLan({ onJoin }: { onJoin: (pairing: Pairing) => void }) {
  const [scanning, setScanning] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scannable = canScanQr()

  // true = code accepté (le scanner s'arrête), false = la lecture continue
  const accept = useCallback(
    (raw: string) => {
      const pairing = parsePairingInput(raw)
      if (!pairing) {
        setError(INVALID)
        return false
      }
      setError(null)
      setScanning(false)
      setText('')
      onJoin(pairing)
      return true
    },
    [onJoin],
  )

  function submit(e: FormEvent) {
    e.preventDefault()
    accept(text)
  }

  return (
    <div className="flex flex-col gap-4">
      {scanning ? (
        <QrScanner onResult={accept} onCancel={() => setScanning(false)} />
      ) : (
        scannable && (
          <button type="button" className={cn(button.primary, 'self-start')} onClick={() => setScanning(true)}>
            Scanner le code
          </button>
        )
      )}

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="lan-link" className={cn(typography.small, 'font-medium')}>
          {scannable ? 'Ou collez le lien de la séance' : 'Lien de la séance'}
        </label>
        <div className="flex gap-2">
          <input
            id="lan-link"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={text}
            placeholder="attendancy://chat?…"
            aria-describedby={error ? 'lan-link-error' : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setError(null)
            }}
            className={cn(typography.small, chat.field)}
          />
          <button type="submit" disabled={!text.trim()} className={scannable ? button.secondary : button.primary}>
            Rejoindre
          </button>
        </div>
        {error && (
          <p id="lan-link-error" role="alert" className={cn(typography.small, 'text-destructive')}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
```

### `packages/ui/src/components/chat/lan/HostLan.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { decodePairing, encodePairing, type Pairing } from '@attendancy/chat'
import { cn } from '../../../lib/utils'
import { button, typography } from '../../../styles/ui'
import { chat } from '../../../styles/ui/chat'
import { randomToken } from './lan-status'

// Frontière avec la couche native (Tauri) : lance le relais (crates/chat/relay) et connaît
// l'adresse locale de l'appareil, que le navigateur ne peut pas obtenir.
export interface HubController {
  start(options: { token: string; port?: number }): Promise<{ host: string; port: number }>
  stop(): Promise<void>
  // Relais déjà lancé (retour sur la page) : on retrouve son code au lieu d'en relancer un
  current(): Promise<{ host: string; port: number; token: string } | null>
}

type Running = { host: string; port: number; token: string }

interface HostLanProps {
  hub: HubController
  sessionId: string
  // L'appareil de l'enseignant rejoint son propre relais (par 127.0.0.1)
  onStarted: (selfPairing: Pairing) => void
  onStopped: () => void
}

export function HostLan({ hub, sessionId, onStarted, onStopped }: HostLanProps) {
  const [running, setRunning] = useState<Running | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void hub.current().then((current) => {
      if (!cancelled && current) setRunning(current)
    })
    return () => {
      cancelled = true
    }
  }, [hub])

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const token = randomToken()
      const { host, port } = await hub.start({ token })
      setRunning({ host, port, token })
      const self = decodePairing(encodePairing({ host: '127.0.0.1', port, token, sessionId }))
      if (self) onStarted(self)
    } catch (e) {
      console.error('Démarrage du relais local impossible:', e)
      setError('Impossible de démarrer le serveur local. Vérifiez que le Wi-Fi est actif et que le port est libre.')
    } finally {
      setBusy(false)
    }
  }

  async function stop() {
    setBusy(true)
    try {
      await hub.stop()
      setRunning(null)
      onStopped()
    } finally {
      setBusy(false)
    }
  }

  const link = running ? encodePairing({ ...running, sessionId }) : ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // presse-papiers refusé : le lien reste affiché et sélectionnable
    }
  }

  if (!running) {
    return (
      <div className="flex flex-col gap-3">
        <p className={cn(typography.small, 'text-foreground/70')}>
          Les élèves scannent un code pour échanger avec vous sans Internet, tant qu&apos;ils sont sur le même réseau.
        </p>
        <button type="button" disabled={busy} onClick={() => void start()} className={cn(button.primary, 'self-start')}>
          {busy ? 'Démarrage…' : 'Ouvrir la séance locale'}
        </button>
        {error && (
          <p role="alert" className={cn(typography.small, 'text-destructive')}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Fond blanc imposé : un lecteur de QR exige un fort contraste clair, même en thème sombre */}
      <div className="self-start rounded-[var(--radius)] bg-white p-3">
        <QRCodeSVG value={link} size={224} level="M" title="Code d'accès à la séance locale" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="lan-share-link" className={cn(typography.small, 'font-medium')}>
          Lien de la séance
        </label>
        <div className="flex gap-2">
          <input
            id="lan-share-link"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(typography.small, chat.field)}
          />
          <button type="button" onClick={() => void copy()} className={button.secondary}>
            Copier
          </button>
        </div>
        <p role="status" className={cn(typography.xsmall, 'text-foreground/60')}>
          {copied ? 'Lien copié' : 'Toute personne qui voit ce code peut rejoindre la séance.'}
        </p>
      </div>

      <button type="button" disabled={busy} onClick={() => void stop()} className={cn(button.secondary, 'self-start')}>
        Fermer la séance locale
      </button>
    </div>
  )
}
```

---

## 3. Orchestration connectée (`apps/web/src/modules/chat/lan/`)

### `apps/web/src/modules/chat/lan/useSyncCounts.ts`

```ts
'use client'

import { useEffect, useState } from 'react'
import { useChatSync } from '@/modules/chat'

// Compteurs de tous les canaux, rechargés à chaque changement d'outbox ou d'inbox
export function useSyncCounts() {
  const sync = useChatSync()
  const [counts, setCounts] = useState({ pending: 0, failed: 0, unverified: 0 })

  useEffect(() => {
    if (!sync) return
    let cancelled = false
    void Promise.all([sync.outbox.list(), sync.inbox.list()]).then(([outbox, inbox]) => {
      if (cancelled) return
      setCounts({
        pending: outbox.filter((i) => i.status === 'pending').length,
        failed: outbox.filter((i) => i.status === 'failed').length,
        unverified: inbox.length,
      })
    })
    return () => {
      cancelled = true
    }
  }, [sync?.version, sync?.outbox, sync?.inbox])

  return counts
}
```

### `apps/web/src/modules/chat/lan/LanPanel.tsx`

```tsx
'use client'

import { button, card, typography } from '@attendancy/ui/styles'
import { HostLan, type HubController } from '@attendancy/ui/chat/lan/HostLan'
import { JoinLan } from '@attendancy/ui/chat/lan/JoinLan'
import { describeLan, plural } from '@attendancy/ui/chat/lan/lan-status'
import { useDelayedFlag } from '@attendancy/ui/chat/useDelayedFlag'
import { cn } from '@/lib/utils'
import { useChatSync } from '@/modules/chat'
import { useSyncCounts } from './useSyncCounts'

interface LanPanelProps {
  // Présent seulement sur l'appareil de l'enseignant (couche native disponible)
  hub?: HubController
  sessionId?: string
}

const chat_dot = 'inline-block size-2.5 shrink-0 rounded-full border-2'

export function LanPanel({ hub, sessionId }: LanPanelProps) {
  const sync = useChatSync()
  const counts = useSyncCounts()
  const connecting = sync?.lan.status === 'connecting' && !sync.lan.failure
  const slow = useDelayedFlag(connecting, 10_000)

  if (!sync) {
    return (
      <p role="status" className={cn(typography.small, 'p-6 text-foreground/70')}>
        Chargement…
      </p>
    )
  }

  const { lan } = sync
  const view = describeLan(lan.status, lan.failure)
  const active = lan.status === 'connected' || connecting

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
      <h1 className={typography.h5}>Réseau local</h1>

      <section aria-labelledby="lan-state" className={cn(card.soft, 'flex flex-col gap-3')}>
        <h2 id="lan-state" className={cn(typography.small, 'flex items-center gap-2 font-medium')}>
          {/* Point plein = connecté, creux = non connecté, barré = refusé : jamais la couleur seule */}
          <span
            aria-hidden
            className={cn(
              chat_dot,
              view.tone === 'on' && 'border-primary bg-primary',
              view.tone === 'wait' && 'border-foreground/60 border-dashed',
              view.tone === 'error' && 'border-destructive bg-destructive',
              view.tone === 'off' && 'border-foreground/60',
            )}
          />
          {view.label}
        </h2>

        {view.detail && (
          <p role="alert" className={cn(typography.small, 'text-destructive')}>
            {view.detail}
          </p>
        )}
        {slow && (
          <p role="status" className={cn(typography.small, 'text-foreground/70')}>
            La connexion tarde. Vérifiez que vous êtes sur le même réseau Wi-Fi que l&apos;enseignant.
          </p>
        )}
        {lan.pairing && active && (
          <p className={cn(typography.xsmall, 'text-foreground/60')}>
            Serveur : {lan.pairing.host}:{lan.pairing.port}
          </p>
        )}

        <ul className={cn(typography.small, 'flex flex-col gap-1 text-foreground/80')}>
          <li>
            {counts.pending > 0
              ? `${plural(counts.pending, 'message attend', 'messages attendent')} d'être envoyé au serveur`
              : "Aucun message en attente d'envoi"}
          </li>
          {counts.failed > 0 && (
            <li className="text-destructive">{plural(counts.failed, 'message a échoué', 'messages ont échoué')}</li>
          )}
          {counts.unverified > 0 && (
            <li>{plural(counts.unverified, 'message reçu en local', 'messages reçus en local')}, pas encore confirmé par le serveur</li>
          )}
        </ul>

        {active && (
          <button type="button" onClick={sync.disconnectLan} className={cn(button.secondary, 'self-start')}>
            Se déconnecter
          </button>
        )}
      </section>

      {!active && (
        <section aria-labelledby="lan-join" className="flex flex-col gap-3">
          <h2 id="lan-join" className={typography.h6}>
            Rejoindre une séance
          </h2>
          <JoinLan onJoin={sync.connectLan} />
        </section>
      )}

      {hub && sessionId && (
        <section aria-labelledby="lan-host" className="flex flex-col gap-3">
          <h2 id="lan-host" className={typography.h6}>
            Ouvrir une séance
          </h2>
          <HostLan hub={hub} sessionId={sessionId} onStarted={sync.connectLan} onStopped={sync.disconnectLan} />
        </section>
      )}
    </div>
  )
}
```

---

## 4. Route client (`apps/chat/src/routes/_app/local.tsx`)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { LanPanel } from '@/modules/chat/lan/LanPanel'

export const Route = createFileRoute('/_app/local')({
  component: LocalPage,
})

function LocalPage() {
  // L'enseignant passera `hub` (couche native) et l'id de la séance ; sans eux, seule la partie
  // « rejoindre » s'affiche.
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <LanPanel />
    </div>
  )
}
```
