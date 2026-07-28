// middleware.ts
// Rafraîchit la session Supabase sur chaque requête matchée et redirige les
// non-authentifiés vers /login. La logique vit dans utils/supabase/middleware —
// ce fichier ne porte que le branchement et le matcher.
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - _next/static, _next/image (assets Next)
     * - favicon et fichiers statiques (svg, png, jpg, webp…)
     * ⚠ À ÉTENDRE PAR PROJET — exclure aussi les routes publiques du projet
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
