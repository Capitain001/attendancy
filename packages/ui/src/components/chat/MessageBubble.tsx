'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { typography } from '../../styles/ui'
import { chat } from '../../styles/ui/chat'
import {
  DEFAULT_MESSAGE_MAX_LENGTH,
  type ChatMessage,
  type MessageActions,
  type ReplyPreview,
} from './types'
import { formatTime } from './utils'

export interface MessageBubbleProps {
  message: ChatMessage
  showAuthor: boolean
  highlighted: boolean
  actions: MessageActions
  maxLength?: number
}

function ReplyQuote({ reply, onJump }: { reply: ReplyPreview; onJump: (id: string) => void }) {
  if (reply.state === 'deleted') return <p className={cn(chat.quote, 'italic')}>Message supprimé</p>
  if (reply.state === 'unknown') return <p className={cn(chat.quote, 'italic')}>Message d&apos;origine indisponible</p>

  return (
    <button
      type="button"
      onClick={() => onJump(reply.id)}
      aria-label={`Aller au message de ${reply.authorName ?? 'cet auteur'}`}
      className={cn(chat.quote, chat.focus, 'rounded-sm')}
    >
      <span className="block font-medium">{reply.authorName}</span>
      <span className="line-clamp-2">{reply.content}</span>
    </button>
  )
}

function MessageEditor({
  initial,
  maxLength,
  onSave,
  onCancel,
}: {
  initial: string
  maxLength: number
  onSave: (content: string) => Promise<boolean>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  const trimmed = draft.trim()
  const canSave = !saving && trimmed.length > 0 && trimmed !== initial.trim()

  async function save() {
    if (!canSave) return
    setSaving(true)
    // Succès : le parent ferme l'éditeur. Échec : le toast est déjà affiché, on reste en édition.
    const ok = await onSave(trimmed)
    if (!ok) setSaving(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={ref}
        value={draft}
        rows={2}
        maxLength={maxLength}
        aria-label="Modifier le message"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') return onCancel()
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            void save()
          }
        }}
        className={chat.editor}
      />
      <div className="flex justify-end gap-1">
        <button type="button" onClick={onCancel} className={chat.textButton}>
          Annuler
        </button>
        <button type="button" onClick={() => void save()} disabled={!canSave} className={cn(chat.textButton, 'font-medium text-foreground')}>
          Enregistrer
        </button>
      </div>
    </div>
  )
}

export function MessageBubble({
  message,
  showAuthor,
  highlighted,
  actions,
  maxLength = DEFAULT_MESSAGE_MAX_LENGTH,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const own = message.isOwn
  const { status } = message
  const confirmed = status === 'sent'

  return (
    <li
      data-message-id={message.id}
      className={cn(chat.row, own ? 'items-end' : 'items-start', showAuthor ? 'mt-3' : 'mt-1')}
    >
      {showAuthor && !own && <span className={cn(typography.xsmall, chat.author)}>{message.user.name}</span>}

      <div
        className={cn(
          chat.bubble,
          own ? chat.bubbleOwn : chat.bubbleOther,
          status === 'sending' && chat.bubbleSending,
          status === 'failed' && chat.bubbleFailed,
          status === 'unverified' && chat.bubbleUnverified,
          highlighted && chat.highlight,
        )}
      >
        {message.replyTo && <ReplyQuote reply={message.replyTo} onJump={actions.onJump} />}

        {editing ? (
          <MessageEditor
            initial={message.content}
            maxLength={maxLength}
            onCancel={() => setEditing(false)}
            onSave={async (content) => {
              const ok = await actions.onEdit(message.id, content)
              if (ok) setEditing(false)
              return ok
            }}
          />
        ) : (
          <p className={cn(typography.small, 'whitespace-pre-wrap')}>{message.content}</p>
        )}
      </div>

      <div className={cn(typography.xsmall, chat.meta, own && 'justify-end')}>
        <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        {message.editedAt && <span title={`Modifié à ${formatTime(message.editedAt)}`}>modifié</span>}
        {status === 'sending' && <span>Envoi en cours…</span>}
        {status === 'failed' && (
          <span role="alert" className="text-destructive">
            Échec de l&apos;envoi
          </span>
        )}
        {status === 'unverified' && (
          <span title="Ce message n'a pas encore été confirmé par le serveur">Reçu en local, non confirmé</span>
        )}

        {confirmed && !editing && (
          <span className={chat.actions}>
            {confirmingDelete ? (
              <span role="group" aria-label="Confirmer la suppression" className="flex items-center gap-1">
                <span>Supprimer ce message ?</span>
                <button
                  type="button"
                  className={cn(chat.textButton, 'text-destructive')}
                  onClick={async () => {
                    const ok = await actions.onDelete(message.id)
                    if (!ok) setConfirmingDelete(false)
                  }}
                >
                  Supprimer
                </button>
                {/* Focus sur l'option sûre : Entrée ne supprime pas par réflexe */}
                <button type="button" autoFocus className={chat.textButton} onClick={() => setConfirmingDelete(false)}>
                  Annuler
                </button>
              </span>
            ) : (
              <>
                <button type="button" className={chat.textButton} onClick={() => actions.onReply(message.id)}>
                  Répondre
                </button>
                {own && (
                  <>
                    <button type="button" className={chat.textButton} onClick={() => setEditing(true)}>
                      Modifier
                    </button>
                    <button type="button" className={chat.textButton} onClick={() => setConfirmingDelete(true)}>
                      Supprimer
                    </button>
                  </>
                )}
              </>
            )}
          </span>
        )}
      </div>

      {status === 'failed' && (
        <div role="group" aria-label="Actions sur l'envoi échoué" className={cn(typography.xsmall, 'mt-1 flex flex-wrap gap-1')}>
          <button type="button" className={chat.textButton} onClick={() => actions.onRetry(message.id)}>
            Réessayer
          </button>
          {/* Parent supprimé ou introuvable : un simple réessai échouerait encore */}
          {message.replyTo && message.replyTo.state !== 'available' && (
            <button
              type="button"
              className={chat.textButton}
              onClick={() => actions.onRetry(message.id, { withoutReply: true })}
            >
              Envoyer sans citation
            </button>
          )}
          <button type="button" className={cn(chat.textButton, 'text-destructive')} onClick={() => actions.onDiscard(message.id)}>
            Abandonner
          </button>
        </div>
      )}
    </li>
  )
}
