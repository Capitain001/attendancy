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

