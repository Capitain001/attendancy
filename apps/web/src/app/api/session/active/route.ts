import { NextResponse } from 'next/server'
import { authAccess } from '@/services/auth'
import { getActiveSessions } from '@/services/session/database'

export async function GET() {
  const auth = await authAccess()
  if (!auth.data) return NextResponse.json({ error: auth.error }, { status: 401 })
  const { orgId } = auth.data

  try {
    const sessions = await getActiveSessions(orgId)
    // Retourner la première session active (ou null)
    const session = sessions[0] ?? null
    return NextResponse.json({ data: session })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
