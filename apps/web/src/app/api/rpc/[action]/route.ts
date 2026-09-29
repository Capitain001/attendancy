// src/app/api/rpc/[action]/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { ERRORS } from '@/config'
import { ACTIONS } from './actions'
// Liste blanche : seules les actions importées ici deviennent publiques.
// Ajoute-les une par une, jamais un `export *` d'un service.


type ActionResult = { data: unknown } | { error: string }
// Cast assumé : chaque action valide son input avec v.safeParse (règle du pattern services).
type Handler = (input: unknown) => Promise<ActionResult>

// Origines Tauri autorisées, ex. RPC_ALLOWED_ORIGINS="tauri://localhost,http://tauri.localhost,http://localhost:1420"
const ALLOWED_ORIGINS = (process.env.RPC_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function respond(req: NextRequest, body: ActionResult, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(req) })
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  // Tauri n'utilise que le Bearer : on refuse le chemin cookies (JWT non vérifié hors middleware)
  if (!req.headers.get('authorization')?.startsWith('Bearer ')) {
    return respond(req, { error: ERRORS.AUTH.UNAUTHORIZED }, 401)
  }

  const { action } = await params
  // hasOwn : évite que "constructor" ou "__proto__" résolvent une propriété héritée
  if (!Object.hasOwn(ACTIONS, action)) {
    return respond(req, { error: 'Action inconnue' }, 404)
  }
  const fn = ACTIONS[action as keyof typeof ACTIONS] as unknown as Handler

  const raw = await req.text()
  let input: unknown
  if (raw) {
    try {
      input = JSON.parse(raw)
    } catch {
      return respond(req, { error: 'JSON invalide' }, 400)
    }
  }

  try {
    const result = await fn(input)
    if ('error' in result) {
      const status = result.error === ERRORS.AUTH.UNAUTHORIZED ? 401 : 400
      return respond(req, result, status)
    }
    return respond(req, result)
  } catch (e) {
    console.error(`[rpc] ${action}`, e)
    return respond(req, { error: ERRORS.SERVER }, 500)
  }
}