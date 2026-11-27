//apps\chat\src\routes\_app\local.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { isTauri } from '@tauri-apps/api/core'
import { useAuthUser } from '@attendancy/auth'
import { createLocalHostTransport } from '@attendancy/chat'
import { LanPanel } from '@/modules/chat/lan/LanPanel'
import { useChatSync } from '@/modules/chat'
// Couche native (livraison 3) : le relais et le pont de l'hôte
import { tauriHostBridge, tauriHub } from '@/native/host'

export const Route = createFileRoute('/_app/local')({
  component: LocalPage,
})

// Hors Tauri (vite seul), pas de relais à ouvrir : seule la partie « rejoindre » s'affiche
const hub = isTauri() ? tauriHub : undefined

function LocalPage() {
  const sync = useChatSync()
  const user = useAuthUser()
  const engine = sync?.engine
  const userId = user?.id

  // Identifiant de la séance, propre à cette visite de la page
  const [sessionId] = useState(() => crypto.randomUUID())

  // Réglages du relais. Le profil métier (buildHostOptions : classe, salle, DM) s'y ajoutera
  // quand les membres des canaux seront disponibles ici ; l'hôte, lui, est déjà connu.
  const hostStartOptions = useMemo(() => (userId ? { hostUserId: userId } : undefined), [userId])

  // Détache le transport local de l'hôte
  const detachRef = useRef<(() => void) | null>(null)

  // Idempotent : appelé à l'ouverture du relais ET quand HostLan le retrouve au retour sur la page
  const attachLocal = useCallback(() => {
    if (!engine || !userId) return
    detachRef.current?.()
    detachRef.current = engine.attach(createLocalHostTransport(tauriHostBridge, { hostUserId: userId }))
  }, [engine, userId])

  const detachLocal = useCallback(() => {
    detachRef.current?.()
    detachRef.current = null
  }, [])

  // Quitter la page détache le transport local ; le relais reste ouvert, et HostLan le retrouve
  // (donc rattache le transport) au retour. Entre-temps, les messages de l'hôte restent dans son
  // outbox et repartent vers le relais au rattachement.
  useEffect(() => detachLocal, [detachLocal])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <LanPanel
        hub={hub}
        sessionId={sessionId}
        hostStartOptions={hostStartOptions}
        onHostStarted={attachLocal}
        onHostStopped={detachLocal}
      />
    </div>
  )
}
