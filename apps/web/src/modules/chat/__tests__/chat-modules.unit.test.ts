import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { insertMessage } from '../cache'
import { registerRealtimeSender, broadcastSent } from '../realtime-registry'
import { messagesKey } from '@/hooks/data/messages/keys'

describe('modules/chat', () => {
  describe('cache.ts - insertMessage', () => {
    it('insère un nouveau message dans un cache normalisé { items, byId }', () => {
      const queryClient = new QueryClient()
      const channelId = 'c-1'
      const key = messagesKey(channelId)

      queryClient.setQueryData(key, {
        items: [{ id: 'm-1', content: 'hello' }],
        byId: { 'm-1': { id: 'm-1', content: 'hello' } },
      })

      insertMessage(queryClient, channelId, { id: 'm-2', content: 'world' })

      const cached = queryClient.getQueryData<{ items: any[]; byId: Record<string, any> }>(key)
      expect(cached?.items).toHaveLength(2)
      expect(cached?.byId['m-2']).toEqual({ id: 'm-2', content: 'world' })
      expect(cached?.items.find((m) => m.id === 'm-2')).toEqual({ id: 'm-2', content: 'world' })
    })

    it('met à jour un message existant sans créer de doublon', () => {
      const queryClient = new QueryClient()
      const channelId = 'c-1'
      const key = messagesKey(channelId)

      queryClient.setQueryData(key, {
        items: [{ id: 'm-1', content: 'hello' }],
        byId: { 'm-1': { id: 'm-1', content: 'hello' } },
      })

      insertMessage(queryClient, channelId, { id: 'm-1', content: 'updated' })

      const cached = queryClient.getQueryData<{ items: any[]; byId: Record<string, any> }>(key)
      expect(cached?.items).toHaveLength(1)
      expect(cached?.byId['m-1'].content).toBe('updated')
      expect(cached?.items[0].content).toBe('updated')
    })

    it('gère le cas où le cache est un tableau brut', () => {
      const queryClient = new QueryClient()
      const channelId = 'c-2'
      const key = messagesKey(channelId)

      queryClient.setQueryData(key, [{ id: 'm-1', content: 'hello' }])

      insertMessage(queryClient, channelId, { id: 'm-2', content: 'world' })

      const cached = queryClient.getQueryData<any[]>(key)
      expect(cached).toHaveLength(2)
      expect(cached?.[1]).toEqual({ id: 'm-2', content: 'world' })
    })

    it('ne fait rien si le cache est vide / non initialisé', () => {
      const queryClient = new QueryClient()
      const channelId = 'c-3'
      const key = messagesKey(channelId)

      insertMessage(queryClient, channelId, { id: 'm-1', content: 'hello' })

      const cached = queryClient.getQueryData(key)
      expect(cached).toBeUndefined()
    })
  })

  describe('realtime-registry.ts', () => {
    it('enregistre et désenregistre un diffuseur par canal', async () => {
      const channelId = 'c-realtime'
      const sender = vi.fn().mockResolvedValue(true)

      const unregister = registerRealtimeSender(channelId, sender)

      await broadcastSent(channelId, {
        id: 'msg-1',
        content: 'Salut',
        createdAt: '2026-11-19T12:00:00.000Z',
        parentId: null,
      })

      expect(sender).toHaveBeenCalledTimes(1)
      expect(sender).toHaveBeenCalledWith({
        id: 'msg-1',
        content: 'Salut',
        createdAt: '2026-11-19T12:00:00.000Z',
        parentId: null,
      })

      unregister()

      const result = broadcastSent(channelId, {
        id: 'msg-2',
        content: 'Salut 2',
        createdAt: '2026-11-19T12:01:00.000Z',
        parentId: null,
      })

      expect(result).toBeUndefined()
      expect(sender).toHaveBeenCalledTimes(1)
    })
  })
})
