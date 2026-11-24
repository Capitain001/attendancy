'use client'

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'
import { typography } from '../../styles/ui'
import { chat } from '../../styles/ui/chat'
import { MessageBubble } from './MessageBubble'
import type { ChatMessage, MessageActions } from './types'
import { dayLabel, isSameDay, startsGroup } from './utils'

// En dessous de cette distance du bas, on considère que la personne « suit » la conversation
const NEAR_BOTTOM_PX = 96
const HIGHLIGHT_MS = 1600

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface MessageListProps {
  messages: ChatMessage[]
  loading: boolean
  hasMore: boolean
  isLoadingOlder: boolean
  onLoadOlder: () => unknown
  // true = le message est maintenant chargé
  onJumpTo: (id: string) => Promise<boolean>
  actions: Omit<MessageActions, 'onJump'>
  maxLength?: number
}

export function MessageList({
  messages,
  loading,
  hasMore,
  isLoadingOlder,
  onLoadOlder,
  onJumpTo,
  actions,
  maxLength,
}: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const initialDone = useRef(false)
  // Position avant le chargement de l'historique, pour la restaurer une fois les messages ajoutés en haut
  const snapshotRef = useRef<{ height: number; top: number } | null>(null)
  const prevRef = useRef<{ firstId?: string; lastId?: string; count: number }>({ count: 0 })

  const [atBottom, setAtBottom] = useState(true)
  const [unseen, setUnseen] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [jumpTarget, setJumpTarget] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const scrollToBottom = useCallback((smooth: boolean) => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: smooth && !reducedMotion() ? 'smooth' : 'auto',
    })
  }, [])

  const onScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
    atBottomRef.current = near
    setAtBottom(near)
    if (near) setUnseen(0)
  }

  // Défilement après chaque changement de messages, avant le rendu à l'écran (pas de saut visible)
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const prev = prevRef.current
    const first = messages[0]?.id
    const last = messages[messages.length - 1]
    prevRef.current = { firstId: first, lastId: last?.id, count: messages.length }

    // 1. Première ouverture : en bas, une fois les messages persistés arrivés
    if (!initialDone.current) {
      if (loading || messages.length === 0) return
      initialDone.current = true
      el.scrollTop = el.scrollHeight
      return
    }

    // 2. Historique ajouté en haut : on garde le même message sous les yeux
    const snap = snapshotRef.current
    if (snap && first !== prev.firstId) {
      el.scrollTop = snap.top + (el.scrollHeight - snap.height)
      snapshotRef.current = null
      return
    }
    if (snap && !isLoadingOlder) snapshotRef.current = null // chargement terminé sans rien ajouter

    // 3. Nouveau message en bas : on suit si la personne est en bas ou si c'est le sien
    if (last && last.id !== prev.lastId) {
      if (last.isOwn || atBottomRef.current) scrollToBottom(true)
      else setUnseen((n) => n + Math.max(1, messages.length - prev.count))
      if (!last.isOwn) setAnnouncement(`${last.user.name} : ${last.content.slice(0, 200)}`)
    }
  }, [messages, loading, isLoadingOlder, scrollToBottom])

  // Le clavier mobile ou une zone de saisie qui grandit réduit la liste : on reste en bas si on y était
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      if (atBottomRef.current) el.scrollTop = el.scrollHeight
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const loadRef = useRef(onLoadOlder)
  useEffect(() => {
    loadRef.current = onLoadOlder
  })
  const requestOlder = useCallback(() => {
    const el = scrollerRef.current
    if (el) snapshotRef.current = { height: el.scrollHeight, top: el.scrollTop }
    loadRef.current()
  }, [])

  // Remonter charge l'historique automatiquement ; le bouton reste le recours au clavier
  useEffect(() => {
    const root = scrollerRef.current
    const target = topRef.current
    if (!root || !target || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingOlder && initialDone.current) requestOlder()
      },
      { root, rootMargin: '200px 0px 0px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isLoadingOlder, requestOlder])

  // Aller à un message cité : déjà chargé, ou chargé page par page (borné côté données)
  const jump = useCallback(
    async (id: string) => {
      setJumpTarget(id)
      if (messages.some((m) => m.id === id)) return
      const ok = await onJumpTo(id)
      if (!ok) {
        setJumpTarget(null)
        toast.info('Ce message est trop ancien pour être affiché ici')
      }
    },
    [messages, onJumpTo],
  )

  useEffect(() => {
    if (!jumpTarget) return
    const el = scrollerRef.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(jumpTarget)}"]`)
    if (!el) return // pas encore rendu : l'effet repasse quand les messages changent
    el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
    setHighlightId(jumpTarget)
    setJumpTarget(null)
  }, [jumpTarget, messages])

  useEffect(() => {
    if (!highlightId) return
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS)
    return () => clearTimeout(timer)
  }, [highlightId])

  const bubbleActions: MessageActions = { ...actions, onJump: (id) => void jump(id) }

  return (
    <div className={chat.listWrap}>
      <div ref={scrollerRef} onScroll={onScroll} className={chat.scroller}>
        <div ref={topRef} aria-hidden className="h-px" />

        {hasMore ? (
          <div className="flex justify-center pb-3">
            <button type="button" disabled={isLoadingOlder} onClick={requestOlder} className={cn(typography.xsmall, chat.textButton)}>
              {isLoadingOlder ? 'Chargement…' : 'Charger les messages précédents'}
            </button>
          </div>
        ) : (
          messages.length > 0 && <p className={cn(typography.xsmall, chat.note)}>Début de la conversation</p>
        )}

        {loading && messages.length === 0 && (
          <p role="status" className={cn(typography.small, chat.note)}>
            Chargement des messages…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p className={cn(typography.small, chat.note)}>Aucun message pour l&apos;instant. Écrivez le premier ci-dessous.</p>
        )}

        <ol aria-label="Messages">
          {messages.map((message, i) => {
            const prev = messages[i - 1]
            const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt)
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <li className={chat.day}>
                    <span className={cn(typography.xsmall, chat.dayLabel)}>{dayLabel(message.createdAt)}</span>
                  </li>
                )}
                <MessageBubble
                  message={message}
                  showAuthor={!message.isOwn && startsGroup(prev, message)}
                  highlighted={message.id === highlightId}
                  actions={bubbleActions}
                  maxLength={maxLength}
                />
              </Fragment>
            )
          })}
        </ol>
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={() => {
            scrollToBottom(true)
            setUnseen(0)
          }}
          className={cn(typography.xsmall, chat.jumpPill)}
        >
          {unseen === 0 ? 'Aller au dernier message' : unseen === 1 ? '1 nouveau message' : `${unseen} nouveaux messages`}
        </button>
      )}

      {/* Annonce des seuls messages entrants, sans relire l'historique chargé en haut */}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
