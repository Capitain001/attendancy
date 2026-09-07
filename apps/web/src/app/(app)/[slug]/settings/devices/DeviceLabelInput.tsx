"use client"

import { useState, useRef } from "react"
import { Pencil, Check, X } from "lucide-react"
import { updateDeviceLabelAction } from "@/services/device"
import { useRouter } from "next/navigation"

interface Props {
  deviceId: string
  initialLabel: string | null
  fallback: string // browser name as fallback display
}

export function DeviceLabelInput({ deviceId, initialLabel, fallback }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialLabel ?? "")
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const display = initialLabel || fallback

  const startEdit = () => {
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const cancel = () => {
    setValue(initialLabel ?? "")
    setEditing(false)
  }

  const save = async () => {
    setSaving(true)
    const label = value.trim() || null
    await updateDeviceLabelAction({ deviceId, label })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save()
    if (e.key === "Escape") cancel()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={50}
          placeholder={fallback}
          className="text-sm font-medium border-b border-primary bg-transparent outline-none w-40"
        />
        <button
          onClick={save}
          disabled={saving}
          className="p-0.5 text-green-600 hover:text-green-700"
        >
          <Check className="size-3.5" />
        </button>
        <button onClick={cancel} className="p-0.5 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startEdit}
      className="group flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
    >
      {display}
      <Pencil className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  )
}
