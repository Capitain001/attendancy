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
