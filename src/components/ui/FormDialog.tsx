'use client'

import { useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'

interface FormDialogProps {
  trigger: ReactNode
  title: string
  description?: string
  children: (close: () => void) => ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FormDialog({
  trigger,
  title,
  description,
  children,
  open: controlledOpen,
  onOpenChange,
}: FormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const close = () => handleOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children(close)}
      </DialogContent>
    </Dialog>
  )
}
