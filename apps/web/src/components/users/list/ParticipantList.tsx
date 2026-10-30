// apps/web/src/components/invitation/thematic/ParticipantList.tsx
// Rangée d'un extrait des membres de la classe (affichage pur, sans sélection).
// Le nombre d'avatars visibles dépend de la largeur disponible : seule la 1re ligne de la grille est affichée.

import { LiveUserIcon } from '@/components/RealTime/UserIcon'
import { cn } from '@/lib/utils'
import type { GetStudentsDto } from '@/services/student'

  interface ParticipantListProps {
    participants: GetStudentsDto 
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
      {participants.map(({ id, user }) => (
        <li key={id}>
          <LiveUserIcon
            userId={user.id}
            avatarUrl={user.avatar_url ?? undefined}
            name={user.firstName ?? user.email}
            showName
            className="w-[72px]"
            avatarClassName="size-14"
          />
        </li>
      ))}
    </ul>
  )
}