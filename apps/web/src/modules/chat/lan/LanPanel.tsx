//apps\web\src\modules\chat\lan\LanPanel.tsx
'use client'

import {
  describeLan,
  describeOmitted,
  HostLan,
  JoinLan,
  plural,
  useDelayedFlag,
  type HubController,
  type HubStartOptions,
} from '@attendancy/ui'
import { button, card, typography } from '@attendancy/ui/styles'
import { cn } from '@/lib/utils'
import { useChatSync } from '@/modules/chat'
import { useSyncCounts } from './useSyncCounts'

interface LanPanelProps {
  // Présent seulement sur l'appareil de l'hôte (couche native disponible)
  hub?: HubController
  sessionId?: string
  // Réglages du relais calculés par l'app (profil métier) : transmis tels quels à HostLan
  hostStartOptions?: Omit<HubStartOptions, 'token'>
  // Relais ouvert (ou retrouvé au retour sur la page) / fermé : l'app attache et détache le
  // transport local de l'hôte. onHostStarted doit être idempotent.
  onHostStarted?: (info: { host: string; port: number }) => void
  onHostStopped?: () => void
  // Canaux imposés par le profil métier (classe, salle…) : priment sur ceux du provider
  channels?: string[]
}

const chat_dot = 'inline-block size-2.5 shrink-0 rounded-full border-2'

export function LanPanel({
  hub,
  sessionId,
  hostStartOptions,
  onHostStarted,
  onHostStopped,
  channels,
}: LanPanelProps) {
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
  const partial = lan.status === 'connected' ? describeOmitted(lan.omitted) : null
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
        {partial && (
          <p role="status" className={cn(typography.small, 'text-foreground/70')}>
            {partial}
          </p>
        )}
        {lan.status === 'connected' && (
          <p className={cn(typography.xsmall, 'text-foreground/60')}>
            Les noms affichés sont déclarés par chaque appareil : ils ne sont pas vérifiés.
          </p>
        )}
        {slow && (
          <p role="status" className={cn(typography.small, 'text-foreground/70')}>
            La connexion tarde. Vérifiez que vous êtes sur le même réseau Wi-Fi que l&apos;hôte.
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
          <JoinLan onJoin={(p) => sync.connectLan(p, { channels })} />
        </section>
      )}

      {hub && sessionId && (
        <section aria-labelledby="lan-host" className="flex flex-col gap-3">
          <h2 id="lan-host" className={typography.h6}>
            Ouvrir une séance
          </h2>
          <HostLan
            hub={hub}
            sessionId={sessionId}
            startOptions={hostStartOptions}
            onStarted={onHostStarted}
            // Le transport local est détaché d'abord, puis la connexion LAN cliente est coupée
            onStopped={() => {
              onHostStopped?.()
              sync.disconnectLan()
            }}
          />
        </section>
      )}
    </div>
  )
}
