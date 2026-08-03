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
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { LiveUserIcon } from "../RealTime/UserIcon"
import { ReusableDialog } from "../tools/ReusableDialog"
import UserIcon from "./UserIcon"

export type CourseTeacherItem = {
  id: string
  name: string | null
  email?: string
  avatar_url?: string | null
  hours: number
  isMain: boolean
}

interface SelectCourseTeacherProps {
  teachers: CourseTeacherItem[]
  courseDuration: number
  value?: string
  onChange?: (value: string) => void
  className?: string
  triggerSizeClass?: string
}

export default function SelectCourseTeacher({
  teachers,
  courseDuration,
  value,
  onChange,
  className,
  triggerSizeClass,
}: SelectCourseTeacherProps) {
  const isControlled = value !== undefined && onChange !== undefined
  const [internalValue, setInternalValue] = React.useState("")
  const selectedValue = isControlled ? value : internalValue

  const setValue = (val: string) => {
    isControlled ? onChange?.(val) : setInternalValue(val)
  }

  const selectedTeacher = teachers.find((t) => t.id === selectedValue)

  const mainTeacher = teachers.filter((t) => t.isMain)
  const assistants = teachers.filter((t) => !t.isMain)

  const renderItem = (teacher: CourseTeacherItem) => {
    const percent =
      courseDuration > 0
        ? Math.min((teacher.hours / courseDuration) * 100, 100)
        : 0

    return (
      <CommandItem
        key={teacher.id}
        value={`${teacher.name ?? ""} ${teacher.email ?? ""}`}
        onSelect={() => setValue(teacher.id)}
        className="flex items-center gap-3 cursor-pointer px-3 py-2"
      >
        {/* 🔹 Bloc gauche */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <LiveUserIcon
            userId={teacher.id}
            avatarUrl={teacher.avatar_url || undefined}
            name={teacher.name || undefined}
            className=""
          />

          <div className="flex flex-col truncate">
            <span className="text-sm font-medium ">
              {teacher.name || "Utilisateur inconnu"}
            </span>

            {teacher.email && (
              <span className="text-xs text-muted-foreground ">
                {teacher.email}
              </span>
            )}
          </div>
        </div>

        {/* 🔹 Barre à droite */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </div>

          <span className="text-[10px] text-muted-foreground w-12 text-right">
            {teacher.hours}h
          </span>
        </div>

        {/* 🔹 Check */}
        <CheckIcon
          size={16}
          className={cn(
            "ml-2 transition-opacity",
            selectedValue === teacher.id ? "opacity-100" : "opacity-0"
          )}
        />
      </CommandItem>
    )
  }

  return (
    <ReusableDialog
      contentClassName="min-w-72 p-0"
      triggerClassName={cn(className)}
      trigger={
      
        <button
          role="combobox"
          className={cn(
            triggerSizeClass,
            " px-2 gap-2 h-10 bg-transparent flex items-center"
          )}
        >
          <UserIcon
            avatarUrl={selectedTeacher?.avatar_url || undefined}
            name={selectedTeacher?.name || undefined}
            className=""
          
          />
          <span className="text-sm rounded-lg px-2 border border-input h-full truncate   backdrop-blur-md flex items-center
          shadow-xs hover:bg-accent hover:text-accent-foreground  dark:border-input dark:hover:bg-input/50
          ">
            {selectedTeacher?.name || "Sélectionner un prof"}
          </span>
        </button>
      }
      content={
        <Command>
          <CommandInput placeholder="Choisir un prof..." />
          <CommandList>
            <CommandEmpty>Aucun professeur trouvé.</CommandEmpty>

            {/* 🔹 MAIN */}
            {mainTeacher.length > 0 && (
              <CommandGroup heading="Principal">
                {mainTeacher.map(renderItem)}
              </CommandGroup>
            )}

            {/* 🔸 SEPARATOR */}
            {mainTeacher.length > 0 && assistants.length > 0 && (
              <CommandSeparator />
            )}

            {/* 🔹 ASSISTANTS */}
            {assistants.length > 0 && (
              <CommandGroup heading="Assistants">
                {assistants.map(renderItem)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      }
    />
  )
}