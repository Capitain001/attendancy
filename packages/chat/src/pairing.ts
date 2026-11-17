// Contenu du QR code affiché par l'enseignant : attendancy://chat?h=..&p=..&t=..&s=..
export type Pairing = { host: string; port: number; token: string; sessionId: string; url: string }

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

// Un QR malveillant ne doit pas pouvoir envoyer l'appareil vers un serveur public.
export function isLocalHost(host: string) {
  if (host === 'localhost' || host.endsWith('.local')) return true
  const m = IPV4.exec(host)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  if ([1, 2, 3, 4].some((i) => Number(m[i]) > 255)) return false
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)
}

export function encodePairing(p: Omit<Pairing, 'url'>) {
  const q = new URLSearchParams({ h: p.host, p: String(p.port), t: p.token, s: p.sessionId })
  return `attendancy://chat?${q.toString()}`
}

export function decodePairing(raw: string): Pairing | null {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.protocol !== 'attendancy:' || u.hostname !== 'chat') return null
  const host = u.searchParams.get('h')
  const port = Number(u.searchParams.get('p'))
  const token = u.searchParams.get('t')
  const sessionId = u.searchParams.get('s')
  if (!host || !token || !sessionId) return null
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null
  if (!isLocalHost(host)) return null
  return { host, port, token, sessionId, url: `ws://${host}:${port}` }
}
