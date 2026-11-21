'use client'

import React, { useRef, useEffect } from 'react'
import { ArrowUp, X, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ReplyPreview } from '@/hooks/chat/types'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e?: React.FormEvent) => void
  replyingTo?: ReplyPreview | null
  onCancelReply?: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  replyingTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Écrivez votre message...',
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus automatique lors de la sélection d'une citation
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  // Ajustement automatique de la hauteur du textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSubmit()
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !disabled) {
      onSubmit(e)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  return (
    <div className={cn('relative flex flex-col rounded-2xl border border-border/70 bg-card p-1.5 shadow-xs transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20', className)}>
      {/* Bandeau de citation active (ReplyingTo) */}
      {replyingTo && (
        <div className="mb-1.5 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-1.5 text-xs text-foreground">
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <CornerDownLeft className="size-3.5 shrink-0 text-primary" />
            <span className="font-semibold text-primary">
              {replyingTo.authorName || 'Utilisateur'}
            </span>
            <span className="truncate text-muted-foreground">
              {replyingTo.content}
            </span>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-5 shrink-0 rounded-full hover:bg-muted"
            onClick={onCancelReply}
          >
            <X className="size-3" />
            <span className="sr-only">Annuler la citation</span>
          </Button>
        </div>
      )}

      {/* Formulaire de saisie */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="max-h-[140px] min-h-[38px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        <Button
          type="submit"
          size="icon"
          disabled={disabled || !value.trim()}
          className="size-8 shrink-0 rounded-xl transition-all"
        >
          <ArrowUp className="size-4" />
          <span className="sr-only">Envoyer</span>
        </Button>
      </form>
    </div>
  )
}
