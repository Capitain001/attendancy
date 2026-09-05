"use client"

import * as React from "react"
import { CheckIcon, BookOpen } from "lucide-react"

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
import { ReusableDialog } from "@/components/tools/ReusableDialog"
import { ResourceIcon } from "@/components/icons/ResourceIcon"


import type { GetUEsDto } from "@/services/ue/types"

type UeItem = GetUEsDto[number]

interface SelectUeProps {
  ues: GetUEsDto
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
}

export default function SelectUe({
  ues,
  value,
  onChange,
  placeholder = "Sélectionner une UE",
  className,
  triggerClassName,
}: SelectUeProps) {
  const isControlled = value !== undefined && onChange !== undefined
  const [internalValue, setInternalValue] = React.useState("")
  const selectedValue = isControlled ? value : internalValue

  const setValue = (newVal: string) => {
    isControlled ? onChange?.(newVal) : setInternalValue(newVal)
  }

  const selectedUE = ues.find((ue) => ue.id === selectedValue)

  // 🔹 Grouper par département
  const uesByDepartment = ues.reduce<Record<string, UeItem[]>>(
    (acc, ue) => {
      const departmentName = ue.department?.name || "Sans département"
      acc[departmentName] ??= []
      acc[departmentName].push(ue)
      return acc
    },
    {}
  )

  return (
    <ReusableDialog
      contentClassName="min-w-72 p-0"
      triggerClassName={cn(className)}
      trigger={
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "flex items-center justify-between w-full",
            triggerClassName
          )}
        >
          {selectedUE ? (
            <div className="flex items-center gap-2 truncate">
               <ResourceIcon name="book-solid" />
              <span className="truncate">
                {selectedUE.name}
                {selectedUE.code && (
                  <span className="text-muted-foreground text-xs ml-1">
                    ({selectedUE.code})
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      }
      content={
        <Command>
          <CommandInput placeholder="Rechercher une UE..." />
          <CommandList>
            <CommandEmpty>Aucune UE trouvée.</CommandEmpty>

            {Object.entries(uesByDepartment).map(
              ([department, deptUes]) => (
                <CommandGroup key={department} heading={department}>
                  {deptUes.map((ue) => (
                    <CommandItem
                      key={ue.id}
                      value={ue.id}
                      keywords={[
                        ue.name,
                        ue.code || "",
                        department,
                      ]}
                      onSelect={() => setValue(ue.id)}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <ResourceIcon name="book-solid" />

                      <div className="flex flex-col truncate">
                        <span className="text-sm font-medium truncate">
                          {ue.name}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {ue.code && `${ue.code} • `}
                    
                        </span>
                      </div>

                      {selectedValue === ue.id && (
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
