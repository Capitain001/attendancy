'use client'

import {
  describeLan,
  HostLan,
  JoinLan,
  plural,
  useDelayedFlag,
  type HubController,
} from '@attendancy/ui'
import { button, card, typography } from '@attendancy/ui/styles'
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
            <li>
              {plural(counts.unverified, 'message reçu en local', 'messages reçus en local')}, pas encore confirmé par le
              serveur
            </li>
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
