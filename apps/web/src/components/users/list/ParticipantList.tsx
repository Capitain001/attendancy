// apps/web/src/components/invitation/thematic/ParticipantList.tsx
// Rangée d'un extrait des membres de la classe (affichage pur, sans sélection).
// Le nombre d'avatars visibles dépend de la largeur disponible : seule la 1re ligne de la grille est affichée.

import { LiveUserIcon } from '@/components/RealTime/UserIcon'
import { cn } from '@/lib/utils'

export type Participant = { id: string; name: string; avatarUrl?: string }

interface ParticipantListProps {
  participants: Participant[]
  className?: string
}

export function ParticipantList({ participants, className }: ParticipantListProps) {
  return (
    <ul
      className={cn(
        'grid grid-cols-[repeat(auto-fill,72px)] grid-rows-[auto] auto-rows-[0px] gap-x-3 gap-y-0 overflow-hidden',
        className,
      )}
    >
      {participants.map((p) => (
        <li key={p.id}>
          <LiveUserIcon
            userId={p.id}
            avatarUrl={p.avatarUrl}
            name={p.name}
            showName
            className="w-[72px]"
            avatarClassName="size-14"
          />
        </li>
      ))}
    </ul>
  )
}