"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { LiveUserIcon } from "../RealTime/UserIcon"
import { ReusableDialog } from "../tools/ReusableDialog"


export type UserInfo = {
  id: string
  name: string | null
  email?: string
  avatar_url?: string | null
  department?: string
}

interface CourseTeachersSelectProps {
  users: UserInfo[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  triggerSizeClass?: string
}

export default function CourseTeachersSelect({
  users,
  value,
  onChange,
  placeholder = "Sélectionner un utilisateur",
  triggerSizeClass,
  className,
}: CourseTeachersSelectProps) {
  // controlled / uncontrolled
  const isControlled = value !== undefined && onChange !== undefined
  const [internalValue, setInternalValue] = React.useState("")
  const selectedValue = isControlled ? value : internalValue

  const setValue = (newVal: string) => {
    isControlled ? onChange?.(newVal) : setInternalValue(newVal)
  }

  const selectedUser = users.find((u) => u.id === selectedValue)

  const usersByDepartment = users.reduce<Record<string, UserInfo[]>>(
    (acc, user) => {
      const department = user.department || "Autres"
      acc[department] ??= []
      acc[department].push(user)
      return acc
    },
    {}
  )

  return (
    <ReusableDialog
      contentClassName="min-w-64 p-0"
      triggerClassName={cn(className)}
      trigger={
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            triggerSizeClass,
            "z-20 flex items-center  size-9 justify-center relative rounded-full border-2 border-input bg-background  hover:border-primary p-0 overflow-hidden [&>svg]:hidden"
          )}
          aria-label={
            selectedUser
              ? `Utilisateur sélectionné: ${selectedUser.name}`
              : placeholder
          }
        >
  
            <div className="text-muted-foreground text-xs">+</div>
     
        </Button>
      }
      content={
        <Command className="">
          <CommandInput placeholder="Rechercher un utilisateur..." />
          <CommandList>
            <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>

            {Object.entries(usersByDepartment).map(
              ([department, deptUsers]) => (
                <CommandGroup key={department} heading={department}>
                  {deptUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      keywords={[
                        user.name || "",
                        user.email || "",
                        department,
                      ]}
                      onSelect={() => setValue(user.id)}
                      className="flex gap-3 items-center px-3 py-2"
                    >
                      <LiveUserIcon
                        userId={user.id}
                        avatarUrl={user.avatar_url || undefined}
                        name={user.name || undefined}
                        className="h-8 w-8 shrink-0"
                      />

                      <div className="flex flex-col truncate">
                        <span className="text-sm font-medium truncate">
                          {user.name || "Utilisateur inconnu"}
                        </span>
                        {user.email && (
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        )}
                      </div>

                      {selectedValue === user.id && (
                        <CheckIcon
                          size={16}
                          className="ml-auto text-primary"
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            )}
          </CommandList>
        </Command>
      }
    />
  )
}
