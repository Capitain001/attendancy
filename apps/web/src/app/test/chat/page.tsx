'use client'

import React, { useState } from 'react'
import {
  Wifi,
  WifiOff,
  UserPlus,
  Radio,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { ChatView } from '@/components/chat-test/ChatView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ChatMessage, ReplyPreview } from '@/hooks/chat/types'

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    content: 'Bonjour tout le monde ! Le cours de maths commence dans 10 minutes.',
    parentId: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    editedAt: null,
    user: { id: 'user-teacher', name: 'M. Dupont (Prof)' },
    isOwn: false,
    status: 'sent',
    replyTo: null,
  },
  {
    id: 'msg-2',
    content: 'Parfait, est-ce qu’on a besoin de la calculatrice graphique aujourd’hui ?',
    parentId: 'msg-1',
    createdAt: new Date(Date.now() - 3000000).toISOString(),
    editedAt: null,
    user: { id: 'user-alice', name: 'Alice' },
    isOwn: true,
    status: 'sent',
    replyTo: {
      id: 'msg-1',
      authorName: 'M. Dupont (Prof)',
      content: 'Bonjour tout le monde ! Le cours de maths commence dans 10 minutes.',
      state: 'available',
    },
  },
  {
    id: 'msg-3',
    content: 'Oui, prenez-la ! On va travailler sur les suites récurrentes.',
    parentId: 'msg-2',
    createdAt: new Date(Date.now() - 2500000).toISOString(),
    editedAt: null,
    user: { id: 'user-teacher', name: 'M. Dupont (Prof)' },
    isOwn: false,
    status: 'sent',
    replyTo: {
      id: 'msg-2',
      authorName: 'Alice',
      content: 'Parfait, est-ce qu’on a besoin de la calculatrice graphique...',
      state: 'available',
    },
  },
  {
    id: 'msg-4',
    content: 'Attention, le WiFi de l’amphi est en panne. Passez sur le chat local de la séance.',
    parentId: null,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    editedAt: null,
    user: { id: 'user-bob', name: 'Bob' },
    isOwn: false,
    status: 'unverified', // Reçu via LAN de pair
    replyTo: null,
  },
  {
    id: 'msg-5',
    content: 'J’ai rejoint le relais local de la salle ! Ça fonctionne sans Internet.',
    parentId: null,
    createdAt: new Date(Date.now() - 300000).toISOString(),
    editedAt: null,
    user: { id: 'user-alice', name: 'Alice' },
    isOwn: true,
    status: 'pending', // En attente de synchronisation
    replyTo: null,
  },
  {
    id: 'msg-6',
    content: 'Voici mon devoir en pièce jointe (erreur réseau temporaire)',
    parentId: null,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    editedAt: null,
    user: { id: 'user-alice', name: 'Alice' },
    isOwn: true,
    status: 'failed', // En échec
    replyTo: null,
  },
]

export default function ChatTestPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [newMessage, setNewMessage] = useState('')
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null)
  const [isTypingPeer, setIsTypingPeer] = useState(false)
  const [connectionState, setConnectionState] = useState<'cloud' | 'lan' | 'offline'>('cloud')
  const [isMuted, setIsMuted] = useState(false)

  // Simulation d'envoi
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    const content = newMessage.trim()
    if (!content) return

    const newMsgId = `local-${Date.now()}`
    const createdMsg: ChatMessage = {
      id: newMsgId,
      content,
      parentId: replyTarget?.id || null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      user: { id: 'user-alice', name: 'Alice' },
      isOwn: true,
      status: connectionState === 'offline' ? 'pending' : 'pending',
      replyTo: replyTarget
        ? {
          id: replyTarget.id,
          authorName: replyTarget.user?.name || 'Inconnu',
          content: replyTarget.content,
          state: 'available',
        }
        : null,
    }

    setMessages((prev) => [...prev, createdMsg])
    setNewMessage('')
    setReplyTarget(null)

    // Si connecté, simulation de confirmation après 1 seconde
    if (connectionState !== 'offline') {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === newMsgId ? { ...m, status: 'sent' } : m))
        )
      }, 1000)
    }
  }

  // Simulation de réessai
  const handleRetryMessage = (id: string, options?: { withoutReply?: boolean }) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            status: 'pending',
            parentId: options?.withoutReply ? null : m.parentId,
            replyTo: options?.withoutReply ? null : m.replyTo,
          }
        }
        return m
      })
    )

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'sent' } : m))
      )
    }, 1200)
  }

  // Simulation de retrait de message local
  const handleDiscardMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  // Simulation de réception d'un message pair LAN (unverified)
  const handleSimulatePeerMessage = () => {
    const peerMsg: ChatMessage = {
      id: `peer-${Date.now()}`,
      content: 'Message instantané reçu en direct d’un camarade sur le réseau local !',
      parentId: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      user: { id: 'user-claire', name: 'Claire' },
      isOwn: false,
      status: connectionState === 'cloud' ? 'sent' : 'unverified',
      replyTo: null,
    }
    setMessages((prev) => [...prev, peerMsg])
  }

  // Reset demo
  const handleReset = () => {
    setMessages(INITIAL_MESSAGES)
    setNewMessage('')
    setReplyTarget(null)
    setIsTypingPeer(false)
  }

  const replyingToPreview: ReplyPreview | null = replyTarget
    ? {
      id: replyTarget.id,
      authorName: replyTarget.user?.name || 'Inconnu',
      content: replyTarget.content,
      state: 'available',
    }
    : null

  return (
    <div className="flex min-h-screen flex-col bg-muted/20 p-4 md:p-8">
      {/* Barre de contrôle du banc d'essai */}
      <div className="mx-auto mb-6 flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground">Banc d'essai UI — Composants Chat</h1>
            <Badge variant="secondary" className="text-[11px]">
              Test visuel pur
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Testez l'affichage des 4 états (<span className="text-emerald-500 font-medium">sent</span>,{' '}
            <span className="text-amber-500 font-medium">unverified (LAN)</span>,{' '}
            <span className="text-blue-500 font-medium">sending</span>,{' '}
            <span className="text-destructive font-medium">failed</span>), la citation et les actions.
          </p>
        </div>

        {/* Boutons d'injection d'événements */}
        <div className="flex flex-wrap items-center gap-2">
          {/* État de connexion */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              size="sm"
              variant={connectionState === 'cloud' ? 'default' : 'ghost'}
              className="h-7 px-2 text-xs"
              onClick={() => setConnectionState('cloud')}
            >
              Cloud
            </Button>
            <Button
              size="sm"
              variant={connectionState === 'lan' ? 'default' : 'ghost'}
              className="h-7 px-2 text-xs"
              onClick={() => setConnectionState('lan')}
            >
              LAN
            </Button>
            <Button
              size="sm"
              variant={connectionState === 'offline' ? 'destructive' : 'ghost'}
              className="h-7 px-2 text-xs"
              onClick={() => setConnectionState('offline')}
            >
              Hors-ligne
            </Button>
          </div>

          {/* Simuler message pair */}
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={handleSimulatePeerMessage}
          >
            <PlusCircle className="size-3" />
            + Message pair
          </Button>

          {/* Simuler frappe pair */}
          <Button
            size="sm"
            variant={isTypingPeer ? 'secondary' : 'outline'}
            className="h-7 gap-1 text-xs"
            onClick={() => setIsTypingPeer((v) => !v)}
          >
            <Radio className="size-3" />
            {isTypingPeer ? 'Arrêter frappe' : 'Simuler frappe'}
          </Button>

          {/* Réinitialiser */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Conteneur principal de la vue Chat */}
      <div className="mx-auto flex h-[720px] w-full max-w-4xl flex-col">
        <ChatView
          title="Terminale S2 — Mathématiques"
          subtitle="Salle A204 · Relais local actif"
          messages={messages}
          newMessage={newMessage}
          onNewMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          replyingTo={replyingToPreview}
          onStartReply={(m) => setReplyTarget(m)}
          onCancelReply={() => setReplyTarget(null)}
          onRetryMessage={handleRetryMessage}
          onDiscardMessage={handleDiscardMessage}
          typingUsers={isTypingPeer ? [{ id: 'user-bob', name: 'Bob' }] : []}
          isConnected={connectionState === 'cloud'}
          isLanConnected={connectionState === 'lan'}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((v) => !v)}
          hasMore={true}
          onLoadOlder={() => {
            alert("Chargement de l'historique déclenché (simulation)")
          }}
          onConnectLan={(p) => {
            alert(`Connexion au relais LAN local : ${p.url}`)
            setConnectionState('lan')
          }}
        />
      </div>
    </div>
  )
}
