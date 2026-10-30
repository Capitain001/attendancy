// apps/web/src/components/invitation/thematic/ExistingUserCombobox.tsx
'use client'
// Bouton « + » ouvrant un combobox d'utilisateurs existants de l'org.

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LiveUserIcon } from '@/components/RealTime/UserIcon'
import type { UserType } from '@/components/users/AvatarSelect'

interface UserComboboxProps<T extends UserType> {
  users: T[]
  onSelect: (user: T) => void
  disabled?: boolean
  triggerClassName?: string
  contentClassName?: string
}


export function UserCombobox<T extends UserType>({
  users,
  onSelect,
  disabled,
  triggerClassName,
  contentClassName,
}: UserComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  // Une invitation est liée à un email : on n'affiche que les users qui en ont un.
  const selectable = users.filter((u) => u.email)

  return (
    // modal : sans ça, le scroll de la liste est bloqué quand le popover est dans un Dialog.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Choisir un utilisateur existant"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50",
            triggerClassName
          )}
        >
          <PlusIcon className="size-4" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className={cn("w-64 p-0", contentClassName)}>
        <Command>
          <CommandInput placeholder="Rechercher un utilisateur..." />
          <CommandList>
            <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
            <CommandGroup>
              {selectable.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  keywords={[user.name ?? '', user.email ?? '']}
                  onSelect={() => {
                    onSelect(user)
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <LiveUserIcon
                    userId={user.id}
                    avatarUrl={user.avatar_url || undefined}
                    name={user.name || undefined}
                    className="h-8 w-8 shrink-0"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {user.name || 'Utilisateur inconnu'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}