"use client"

import * as React from "react"

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"

interface ReusableDialogProps {
  /** Élément déclencheur du dialog */
  trigger: React.ReactNode

  /** Contenu du dialog */
  content: React.ReactNode

  /** Classe personnalisée pour DialogContent */
  contentClassName?: string
  triggerClassName?: string

  /** Cacher le bouton close */
  closeButton?: boolean

  /** Props avancées Radix si besoin */
  dialogProps?: React.ComponentProps<typeof Dialog>
}

export function ReusableDialog({
  trigger,
  content,
  contentClassName,
  triggerClassName,
  closeButton = false,
  dialogProps,
}: ReusableDialogProps) {
  return (
    <Dialog {...dialogProps}>
      <DialogTrigger className={triggerClassName} asChild>
        {trigger}
      </DialogTrigger>
        <DialogTitle className="sr-only">
          dialog
        </DialogTitle>
      <DialogContent
        className={cn(contentClassName)}
        showCloseButton={closeButton}
      >
        {content}
      </DialogContent>
    </Dialog>
  )
}
