import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GetMessagesDto } from '@/services/message'
import { MESSAGES_PAGE_SIZE } from '@/services/message/constants'

// Mock des hooks React pour environnement Node
const stateMap = new Map<string, any>()
let refMap = new Map<string, { current: any }>()

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useRef: vi.fn((initial: any) => {
      return { current: initial }
    }),
    useState: vi.fn((initial: any) => {
      let val = typeof initial === 'function' ? initial() : initial
      const setter = vi.fn((next: any) => {
        val = typeof next === 'function' ? next(val) : next
      })
      return [val, setter]
    }),
    useMemo: vi.fn((fn: () => any) => fn()),
    useCallback: vi.fn((fn: (...args: any[]) => any) => fn),
  }
})

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

const { getOlderMessagesActionMock } = vi.hoisted(() => ({
  getOlderMessagesActionMock: vi.fn(),
}))

vi.mock('@/services/message/actions', () => ({
  getOlderMessagesAction: getOlderMessagesActionMock,
}))

import { useOlderMessages } from './useOlderMessages'

type Dto = GetMessagesDto[number]

function createMsg(id: string, dateIso: string): Dto {
  return {
    id,
    content: `msg-${id}`,
    createdAt: new Date(dateIso),
    updatedAt: new Date(dateIso),
    editedAt: null,
    channelId: 'channel-1',
    parentId: null,
    user: { id: 'u1', firstName: 'Alice', lastName: null, avatar_url: null },
  }
}

describe('useOlderMessages', () => {
  const channelId = 'channel-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dérive hasMore = false si la liste a moins de MESSAGES_PAGE_SIZE (50) éléments', () => {
    const items = [
      createMsg('1', '2026-11-18T10:00:00.000Z'),
      createMsg('2', '2026-11-18T10:01:00.000Z'),
    ]
    const updateItems = vi.fn()

    const { hasMore } = useOlderMessages({ channelId, items, updateItems })
    expect(hasMore).toBe(false)
  })

  it('dérive hasMore = true si la liste contient 50 éléments ou plus', () => {
    const items = Array.from({ length: MESSAGES_PAGE_SIZE }, (_, i) =>
      createMsg(`msg-${i}`, new Date(Date.UTC(2026, 10, 18, 10, i)).toISOString()),
    )
    const updateItems = vi.fn()

    const { hasMore } = useOlderMessages({ channelId, items, updateItems })
    expect(hasMore).toBe(true)
  })

  it('appelle getOlderMessagesAction avec le curseur du message le plus ancien', async () => {
    // 50 messages, du plus ancien (09:00) au plus récent (09:49)
    const items = Array.from({ length: 50 }, (_, i) =>
      createMsg(`msg-${i}`, new Date(Date.UTC(2026, 10, 18, 9, i)).toISOString()),
    )
    const updateItems = vi.fn()

    getOlderMessagesActionMock.mockResolvedValueOnce({
      data: {
        items: [
          createMsg('older-1', '2026-11-18T08:50:00.000Z'),
          createMsg('older-2', '2026-11-18T08:51:00.000Z'),
        ],
        hasMore: true,
      },
    })

    const { loadOlder } = useOlderMessages({ channelId, items, updateItems })
    await loadOlder()

    expect(getOlderMessagesActionMock).toHaveBeenCalledWith({
      channelId,
      before: {
        createdAt: items[0].createdAt.toISOString(),
        id: items[0].id,
      },
    })
    expect(updateItems).toHaveBeenCalledOnce()
  })

  it('la garde applied : ignore la page si le curseur a disparu du cache entre-temps', async () => {
    const oldestItem = createMsg('msg-0', '2026-11-18T09:00:00.000Z')
    const items = [
      oldestItem,
      ...Array.from({ length: 49 }, (_, i) =>
        createMsg(`msg-${i + 1}`, new Date(Date.UTC(2026, 10, 18, 9, i + 1)).toISOString()),
      ),
    ]

    let updaterFn: ((current: Dto[]) => Dto[]) | null = null
    const updateItems = vi.fn((fn) => {
      updaterFn = fn
    })

    const olderItems = [createMsg('older-0', '2026-11-18T08:00:00.000Z')]
    getOlderMessagesActionMock.mockResolvedValueOnce({
      data: {
        items: olderItems,
        hasMore: true,
      },
    })

    const { loadOlder } = useOlderMessages({ channelId, items, updateItems })
    await loadOlder()

    expect(updaterFn).not.toBeNull()

    // Simulation : un refetch avec reset a eu lieu pendant le fetch réseau,
    // donc 'msg-0' n'est plus dans le cache courant !
    const cacheAfterReset = [createMsg('fresh-100', '2026-11-18T12:00:00.000Z')]
    const result = updaterFn!(cacheAfterReset)

    // La page reçue est ignorée et le cache reste inchangé pour éviter de créer un trou
    expect(result).toBe(cacheAfterReset)
    expect(result.some((m) => m.id === 'older-0')).toBe(false)
  })

  it('fusionne correctement avec mergeItemsById quand le curseur est présent', async () => {
    const oldestItem = createMsg('msg-0', '2026-11-18T09:00:00.000Z')
    const items = [
      oldestItem,
      ...Array.from({ length: 49 }, (_, i) =>
        createMsg(`msg-${i + 1}`, new Date(Date.UTC(2026, 10, 18, 9, i + 1)).toISOString()),
      ),
    ]

    let updaterFn: ((current: Dto[]) => Dto[]) | null = null
    const updateItems = vi.fn((fn) => {
      updaterFn = fn
    })

    const olderItems = [
      createMsg('older-0', '2026-11-18T08:58:00.000Z'),
      createMsg('older-1', '2026-11-18T08:59:00.000Z'),
    ]
    getOlderMessagesActionMock.mockResolvedValueOnce({
      data: {
        items: olderItems,
        hasMore: true,
      },
    })

    const { loadOlder } = useOlderMessages({ channelId, items, updateItems })
    await loadOlder()

    expect(updaterFn).not.toBeNull()

    // Le curseur 'msg-0' est bien présent dans le cache
    const merged = updaterFn!(items)
    // Les anciens sont fusionnés au sommet
    expect(merged.some((m) => m.id === 'older-0')).toBe(true)
    expect(merged.some((m) => m.id === 'older-1')).toBe(true)
    expect(merged.some((m) => m.id === 'msg-0')).toBe(true)
  })

  it('gère l’épuisement de l’historique (hasMore = false du serveur)', async () => {
    const oldestItem = createMsg('msg-0', '2026-11-18T09:00:00.000Z')
    const items = [
      oldestItem,
      ...Array.from({ length: 49 }, (_, i) =>
        createMsg(`msg-${i + 1}`, new Date(Date.UTC(2026, 10, 18, 9, i + 1)).toISOString()),
      ),
    ]

    let updaterFn: ((current: Dto[]) => Dto[]) | null = null
    const updateItems = vi.fn((fn) => {
      updaterFn = fn
    })

    const olderItems = [createMsg('very-first-msg', '2026-11-18T07:00:00.000Z')]
    getOlderMessagesActionMock.mockResolvedValueOnce({
      data: {
        items: olderItems,
        hasMore: false, // Plus rien avant !
      },
    })

    const { loadOlder } = useOlderMessages({ channelId, items, updateItems })
    await loadOlder()

    // L'updater applique la page
    expect(updaterFn).not.toBeNull()
    const merged = updaterFn!(items)
    expect(merged.some((m) => m.id === 'very-first-msg')).toBe(true)
  })

  it('toast une erreur si getOlderMessagesAction échoue', async () => {
    const { toast } = await import('sonner')
    const items = Array.from({ length: 50 }, (_, i) =>
      createMsg(`msg-${i}`, new Date(Date.UTC(2026, 10, 18, 9, i)).toISOString()),
    )
    const updateItems = vi.fn()

    getOlderMessagesActionMock.mockResolvedValueOnce({
      error: 'Erreur réseau',
    })

    const { loadOlder } = useOlderMessages({ channelId, items, updateItems })
    await loadOlder()

    expect(toast.error).toHaveBeenCalledWith('Erreur réseau')
    expect(updateItems).not.toHaveBeenCalled()
  })
})
