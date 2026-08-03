import { getUserInfo } from '@/modules/user'
import { clearCache, getUser } from '@/modules/user/lru-cache'
import { createClient } from '@/utils/supabase/server'
import { jwtDecode } from 'jwt-decode'

async function t<T>(label: string, fn: () => Promise<T>): Promise<{ label: string; ms: number; result: T }> {
  const t0 = performance.now()
  const result = await fn()
  return { label, ms: performance.now() - t0, result }
}

function color(ms: number) {
  if (ms < 5) return '#22c55e'
  if (ms < 50) return '#eab308'
  if (ms < 200) return '#f97316'
  return '#ef4444'
}

function Row({ label, ms, note }: { label: string; ms: number; note?: string }) {
  return (
    <tr style={{ borderBottom: '1px dashed #222' }}>
      <td style={{ padding: '0.3rem 1.5rem 0.3rem 0' }}>{label}</td>
      <td style={{ textAlign: 'right', paddingRight: '1.5rem', color: color(ms), fontWeight: 600 }}>
        {ms.toFixed(2)}
      </td>
      <td style={{ color: '#555', fontSize: '11px' }}>{note ?? ''}</td>
    </tr>
  )
}

export default async function TestPage() {
  // ── Section 1 : isoler createClient + getSession ──────────────────────────
  const r1 = await t('createClient()', () => createClient())
  const client = r1.result

  const r2 = await t('getSession() seul', async () => {
    const { data: { session } } = await client.auth.getSession()
    return session
  })
  const session = r2.result

  const userId = session?.access_token
    ? (jwtDecode(session.access_token) as { sub: string }).sub
    : null

  const r3 = await t('getUser() réseau', async () => {
    const { data: { user } } = await client.auth.getUser()
    return user
  })

  // ── Section 2 : getUserInfo complet ───────────────────────────────────────
  clearCache()

  const r4 = await t('getUserInfo() — cold (LRU miss)', () => getUserInfo())
  const r5 = await t('getUserInfo() — warm ①', () => getUserInfo())
  const r6 = await t('getUserInfo() — warm ②', () => getUserInfo())
  const r7 = await t('getUserInfo() — warm ③', () => getUserInfo())

  const lruHit = userId ? !!getUser(userId) : false
  const warmAvg = ((r5.ms + r6.ms + r7.ms) / 3).toFixed(2)

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '13px', maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Bench isolé — getUserInfo()
      </h1>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '11px' }}>
        userId: <strong>{userId?.slice(0, 8) ?? 'null'}…</strong>
        {' '}| LRU après bench: <strong style={{ color: lruHit ? '#22c55e' : '#ef4444' }}>{lruHit ? 'chaud' : 'froid'}</strong>
      </p>

      <h2 style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        § 1 — Supabase client isolé
      </h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
        <tbody>
          <Row label="createClient()" ms={r1.ms} note="cookies() + createServerClient()" />
          <Row label="getSession()" ms={r2.ms} note="lecture cookie + JWT decode (local)" />
          <Row label="getUser() réseau" ms={r3.ms} note="validation réseau Supabase" />
          <Row label="createClient + getSession total" ms={r1.ms + r2.ms} note="coût réel de getUserId()" />
        </tbody>
      </table>

      <h2 style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        § 2 — getUserInfo() complet
      </h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1.5rem' }}>
        <tbody>
          <Row label="① cold — LRU miss" ms={r4.ms} note={`user: ${r4.result ? '✓' : '✗'}`} />
          <Row label="② warm — LRU hit" ms={r5.ms} note={`user: ${r5.result ? '✓' : '✗'}`} />
          <Row label="③ warm — LRU hit" ms={r6.ms} note={`user: ${r6.result ? '✓' : '✗'}`} />
          <Row label="④ warm — LRU hit" ms={r7.ms} note={`user: ${r7.result ? '✓' : '✗'}`} />
        </tbody>
      </table>

      <div style={{ color: '#aaa', lineHeight: '1.9', fontSize: '12px' }}>
        <div>warm avg: <strong style={{ color: '#fff' }}>{warmAvg} ms</strong></div>
        <div>cold:     <strong style={{ color: '#fff' }}>{r4.ms.toFixed(2)} ms</strong></div>
        <div>createClient alone: <strong style={{ color: '#fff' }}>{r1.ms.toFixed(2)} ms</strong></div>
        <div>getSession alone:   <strong style={{ color: '#fff' }}>{r2.ms.toFixed(2)} ms</strong></div>
        <div>getUser réseau:     <strong style={{ color: '#fff' }}>{r3.ms.toFixed(2)} ms</strong></div>
      </div>

      <div style={{ marginTop: '1.2rem', padding: '0.6rem', background: '#111', borderRadius: '6px', color: '#555', fontSize: '11px' }}>
        {'< 5ms'} vert | {'< 50ms'} jaune | {'< 200ms'} orange | {'≥ 200ms'} rouge
      </div>
    </div>
  )
}
