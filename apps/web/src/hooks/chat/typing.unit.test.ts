import { describe, expect, it, vi } from 'vitest'
import type { PresenceUser } from '@/types'
import { TYPING_EXPIRE_MS, TYPING_THROTTLE_MS } from './constants'

describe('Indicateur de frappe (typing indicator - version iswriting)', () => {
  it('constants : TYPING_EXPIRE_MS est supérieur à TYPING_THROTTLE_MS', () => {
    expect(TYPING_EXPIRE_MS).toBeGreaterThan(TYPING_THROTTLE_MS)
  })

  it('withoutId : ne recrée pas de Set si l’id n’est pas présent', () => {
    const withoutId = (current: ReadonlySet<string>, id: string): ReadonlySet<string> => {
      if (!current.has(id)) return current
      const next = new Set(current)
      next.delete(id)
      return next
    }

    const set = new Set(['user-1', 'user-2'])
    const same = withoutId(set, 'user-3')
    expect(same).toBe(set) // Même référence, zéro re-render !

    const updated = withoutId(set, 'user-1')
    expect(updated).not.toBe(set)
    expect(updated.has('user-1')).toBe(false)
    expect(updated.has('user-2')).toBe(true)
  })

  it('résout typingUsers via la Présence et ignore les utilisateurs déconnectés', () => {
    const connectedUsers: Record<string, PresenceUser> = {
      'u-1': { id: 'u-1', name: 'Alice' } as PresenceUser,
      'u-2': { id: 'u-2', name: 'Bob' } as PresenceUser,
    }

    // u-1 est en train d'écrire, et u-ghost a envoyé un broadcast mais n'est pas dans Présence
    const typingIds = new Set(['u-1', 'u-ghost'])

    const typingUsers = [...typingIds]
      .map((id) => connectedUsers[id])
      .filter((u): u is PresenceUser => !!u)

    expect(typingUsers.length).toBe(1)
    expect(typingUsers[0].name).toBe('Alice')
  })

  it('gère l’expiration automatique après TYPING_EXPIRE_MS (4s)', () => {
    vi.useFakeTimers()

    const typingIds = new Set<string>()
    const timers = new Map<string, any>()

    const clearTyping = (id: string) => {
      const timer = timers.get(id)
      if (timer) clearTimeout(timer)
      timers.delete(id)
      typingIds.delete(id)
    }

    const onTyping = (id: string, typing: boolean) => {
      if (!typing) return clearTyping(id)

      const prev = timers.get(id)
      if (prev) clearTimeout(prev)
      typingIds.add(id)
      timers.set(
        id,
        setTimeout(() => clearTyping(id), TYPING_EXPIRE_MS),
      )
    }

    onTyping('u-1', true)
    expect(typingIds.has('u-1')).toBe(true)

    // Avance de 2 secondes : u-1 tape encore
    vi.advanceTimersByTime(2000)
    expect(typingIds.has('u-1')).toBe(true)
    onTyping('u-1', true) // Réarmement

    // Avance de 3 secondes : toujours actif grâce au réarmement
    vi.advanceTimersByTime(3000)
    expect(typingIds.has('u-1')).toBe(true)

    // Avance de 1,5 seconde : 4s écoulées depuis le dernier réarmement -> expire
    vi.advanceTimersByTime(1500)
    expect(typingIds.has('u-1')).toBe(false)

    vi.useRealTimers()
  })

  it('éteint immédiatement l’indicateur lors d’un typing: false explicite', () => {
    const typingIds = new Set<string>()
    const timers = new Map<string, any>()

    const clearTyping = (id: string) => {
      const timer = timers.get(id)
      if (timer) clearTimeout(timer)
      timers.delete(id)
      typingIds.delete(id)
    }

    const onTyping = (id: string, typing: boolean) => {
      if (!typing) return clearTyping(id)
      typingIds.add(id)
    }

    onTyping('u-1', true)
    expect(typingIds.has('u-1')).toBe(true)

    // u-1 efface son texte ou envoie le message -> typing: false
    onTyping('u-1', false)
    expect(typingIds.has('u-1')).toBe(false)
  })

  it('le throttle notifyTyping limite à un envoi toutes les TYPING_THROTTLE_MS pour true, et immédiat pour false', () => {
    let lastSent = 0
    let sendCount = 0

    const notifyTyping = (typing: boolean, now: number) => {
      if (typing) {
        if (now - lastSent < TYPING_THROTTLE_MS) return false
        lastSent = now
      } else {
        if (lastSent === 0) return false
        lastSent = 0
      }
      sendCount++
      return true
    }

    const t0 = 10000
    // 1ère frappe : émise
    expect(notifyTyping(true, t0)).toBe(true)
    expect(sendCount).toBe(1)

    // Frappes répétées à t0 + 500ms, t0 + 2000ms : ignorées
    expect(notifyTyping(true, t0 + 500)).toBe(false)
    expect(notifyTyping(true, t0 + 2000)).toBe(false)
    expect(sendCount).toBe(1)

    // Frappe à t0 + 2600ms (> 2500ms) : émise
    expect(notifyTyping(true, t0 + 2600)).toBe(true)
    expect(sendCount).toBe(2)

    // Envoi du message (typing: false) : part tout de suite sans attendre
    expect(notifyTyping(false, t0 + 2700)).toBe(true)
    expect(sendCount).toBe(3)

    // Second typing: false consécutif : ignoré car lastSent est déjà à 0
    expect(notifyTyping(false, t0 + 2800)).toBe(false)
    expect(sendCount).toBe(3)
  })
})
