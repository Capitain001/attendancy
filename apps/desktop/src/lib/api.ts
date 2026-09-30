// apps/desktop/src/lib/api.ts
import type { ApiClient } from '@attendancy/types'
import { API_URL } from '../config/url'
import { getToken } from './auth'

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const reviver = (_: string, v: unknown) =>
  typeof v === 'string' && ISO.test(v) ? new Date(v) : v

export const api = new Proxy({}, {
  get: (_, action: string) => async (input?: unknown) => {
    const res = await fetch(`${API_URL}/api/rpc/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getToken()}`,
      },
      body: input === undefined ? undefined : JSON.stringify(input),
    })
    return JSON.parse(await res.text(), reviver)
  },
}) as ApiClient