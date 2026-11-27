// packages/ui/src/components/chat/lan/HostLan.tsx
'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { encodePairing } from '@attendancy/chat'
import { cn } from '../../../lib/utils'
import { button, typography } from '../../../styles/ui'
import { chat } from '../../../styles/ui/chat'
import { randomToken } from './lan-status'

// Frontière avec la couche native (Tauri) : lance le relais (crates/chat/relay) et connaît
// les adresses locales de l'appareil, que le navigateur ne peut pas obtenir.
export type HubStartOptions = {
  token: string
  port?: number
  // Réglages du profil métier (buildHostOptions), transmis tels quels au relais
  hostUserId?: string
  members?: Record<string, string[]>
  maxConnections?: number
  maxPendingHello?: number
}

// `host` = la meilleure adresse ; `addresses` = tous les choix quand l'appareil en a plusieurs
// (Wi-Fi + partage de connexion, par exemple), la meilleure en premier.
export type HubInfo = { host: string; port: number; addresses?: string[] }

export interface HubController {
  start(options: HubStartOptions): Promise<HubInfo>
  stop(): Promise<void>
  // Relais déjà lancé (retour sur la page) : on retrouve son code au lieu d'en relancer un
  current(): Promise<(HubInfo & { token: string }) | null>
}

type Running = HubInfo & { token: string }

interface HostLanProps {
  hub: HubController
  sessionId: string
  // Réglages du relais calculés par l'app (profil métier) ; le jeton est ajouté ici
  startOptions?: Omit<HubStartOptions, 'token'>
  // Prévenu quand le relais est ouvert OU retrouvé en revenant sur la page : l'appelant doit
  // être idempotent. L'hôte n'y rejoint PAS son propre relais comme client (son identité y est
  // réservée) : il passe par le transport local.
  onStarted?: (info: { host: string; port: number }) => void
  onStopped: () => void
}

export function HostLan({ hub, sessionId, startOptions, onStarted, onStopped }: HostLanProps) {
  const [running, setRunning] = useState<Running | null>(null)
  // Adresse choisie pour le QR ; null = la meilleure (running.host)
  const [chosen, setChosen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void hub.current().then((current) => {
      if (cancelled || !current) return
      setRunning(current)
      // Le relais tourne déjà : le transport local de l'hôte doit être rattaché (onStarted idempotent)
      onStarted?.({ host: current.host, port: current.port })
    })
    return () => {
      cancelled = true
    }
    // onStarted volontairement absent : on ne relit pas le relais à chaque rendu du parent
  }, [hub]) // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const token = randomToken()
      const info = await hub.start({ ...startOptions, token })
      setRunning({ ...info, token })
      setChosen(null)
      onStarted?.({ host: info.host, port: info.port })
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
      setChosen(null)
      onStopped()
    } finally {
      setBusy(false)
    }
  }

  // L'adresse choisie doit faire partie des adresses proposées, sinon on retombe sur la meilleure
  const address = running ? (chosen && running.addresses?.includes(chosen) ? chosen : running.host) : ''
  const link = running
    ? encodePairing({ host: address, port: running.port, token: running.token, sessionId })
    : ''

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
          Les autres appareils scannent un code pour échanger avec vous sans Internet, tant qu&apos;ils sont sur le même réseau.
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
      {running.addresses && running.addresses.length > 1 && (
        <div className="flex flex-col gap-2">
          <label htmlFor="lan-address" className={cn(typography.small, 'font-medium')}>
            Adresse de cet appareil
          </label>
          <select
            id="lan-address"
            value={address}
            onChange={(e) => setChosen(e.target.value)}
            className={cn(typography.small, chat.field, 'self-start')}
          >
            {running.addresses.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <p className={cn(typography.xsmall, 'text-foreground/60')}>
            Choisissez celle du réseau où se trouvent les autres appareils. Le code change avec elle.
          </p>
        </div>
      )}

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
        <p className={cn(typography.xsmall, 'text-foreground/60')}>
          Si personne ne parvient à rejoindre la séance, autorisez l&apos;application dans le pare-feu
          Windows (réseau privé).
        </p>
      </div>

      <button type="button" disabled={busy} onClick={() => void stop()} className={cn(button.secondary, 'self-start')}>
        Fermer la séance locale
      </button>
    </div>
  )
}

