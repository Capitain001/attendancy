// packages/ui/src/components/chat/Composer.tsx
'use client'

import { useLayoutEffect, type FormEvent, type KeyboardEvent, type RefObject } from 'react'
import { cn } from '../../lib/utils'
import { button, typography } from '../../styles/ui'
import { chat } from '../../styles/ui/chat'
import { DEFAULT_MESSAGE_MAX_LENGTH, type ReplyPreview } from './types'

const MAX_FIELD_HEIGHT_PX = 160

export interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (event: FormEvent) => unknown
  replyingTo: ReplyPreview | null
  onCancelReply: () => void
  // Créée par le parent : il peut donner le focus après « Répondre »
  inputRef: RefObject<HTMLTextAreaElement | null>
  maxLength?: number
}

export function Composer({
  value,
  onChange,
  onSubmit,
  replyingTo,
  onCancelReply,
  inputRef,
  maxLength = DEFAULT_MESSAGE_MAX_LENGTH,
}: ComposerProps) {
  // La zone grandit avec le texte (jusqu'à une hauteur max) et se réduit une fois vidée
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_FIELD_HEIGHT_PX)}px`
  }, [value, inputRef])

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape' && replyingTo) {
      e.preventDefault()
      return onCancelReply()
    }
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    // Écran tactile : Entrée = retour à la ligne, on envoie avec le bouton
    if (window.matchMedia('(pointer: coarse)').matches) return
    e.preventDefault()
    e.currentTarget.form?.requestSubmit()
  }

  const nearLimit = value.length > maxLength * 0.9

  return (
    <form onSubmit={onSubmit} className={chat.composer}>
      {replyingTo && (
        <div className={chat.replyBar}>
          <div className={cn(typography.xsmall, 'min-w-0 flex-1')}>
            <p className="font-medium">Réponse à {replyingTo.authorName ?? 'un message'}</p>
            <p className="line-clamp-1 text-foreground/70">{replyingTo.content}</p>
          </div>
          <button type="button" onClick={onCancelReply} className={cn(typography.xsmall, chat.textButton)}>
            Annuler
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={value}
          rows={1}
          maxLength={maxLength}
          placeholder="Écrire un message"
          aria-label="Message"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(typography.small, chat.field)}
        />
        {/* mouseDown : garde le focus (et le clavier mobile ouvert) dans la zone de saisie */}
        <button type="submit" disabled={!value.trim()} onMouseDown={(e) => e.preventDefault()} className={button.primary}>
          Envoyer
        </button>
      </div>

      {nearLimit && (
        <p className={cn(typography.xsmall, 'mt-1 text-right text-foreground/60')}>
          {value.length} / {maxLength}
        </p>
      )}
    </form>
  )
}
