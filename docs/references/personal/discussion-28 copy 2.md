1-getUserInfo est le bon point d'entrée 

2-Sécurité : getUserId décode le JWT sans le vérifier (jwtDecode). C'est acceptable sur le chemin cookies parce que le middleware appelle getClaims() avant. Le Bearer arrive sur /api/rpc sans ce middleware. Il faut donc vérifier la signature avant de consulter le LRU. Sinon, un JWT forgé avec le sub d'un autre utilisateur lirait son profil en cache.

=>

// src/utils/supabase/bearer.ts
import { createClient as createTokenClient } from "@supabase/supabase-js"

/**
 * Client Supabase stateless pour la vérification des tokens Bearer (Tauri / API).
 * Sans persistance de session ni rafraîchissement par cookies.
 */
export const createBearerClient = () =>
  createTokenClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

src/services/users/getUserInfo.ts
"use server"
import { cache } from "react"
import { headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createBearerClient } from "@/utils/supabase/bearer"
import { mapUserInfo, type UserMetadata, type UserInfo } from "@/types/user"
import { getUser, setUser, removeUser } from "./lru-cache"

export interface GetUserInfoOptions {
  cache?: boolean
  refresh?: boolean
}

/**
 * Extrait le token Bearer de l'en-tête Authorization s'il existe.
 */
const getBearerToken = cache(async (): Promise<string | null> => {
  const auth = (await headers()).get("authorization")
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null
})

/**
 * Extrait l'userId (Bearer ou Cookie)
 */
const getUserId = cache(async (): Promise<string | null> => {
  const bearer = await getBearerToken()

  if (bearer) {
    const { data, error } = await createBearerClient().auth.getClaims(bearer)
    return error || !data ? null : ((data.claims.sub as string) ?? null)
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
})




2-Invalidation du Cache ("use cache")
Problème identifié : updateTag échoue silencieusement lorsqu'il est appelé depuis une Route Handler (/api/rpc).

Solution suggerer : Implémentation d'un helper expireTag qui tente updateTag (Server Actions), puis effectue un fallback sur revalidateTag(tag, { expire: 0 }) (Route Handlers).

details. updateTag échoue en silence dans /api/rpc

"use cache" vit côté serveur. Si une mutation passe par la route RPC sans invalider le tag, la mise à jour côté Tauri ne change rien. Le client invalide son cache TanStack et refait un getXAction, mais le serveur renvoie la version encore en cache jusqu'à expiration de cacheLife. Les utilisateurs web verraient aussi des données périmées.

updateTag ne peut être appelé que depuis une Server Action, pas depuis un Route Handler. Dans ton moteur, l'erreur est avalée par le catch « silencieux volontaire », donc tu ne verrais rien. revalidateTag est utilisable dans les Route Handlers, et son second argument { expire: 0 } force une expiration immédiate. 
dev
nextjs

Le correctif tient dans engine.ts :

ts
import { updateTag, revalidateTag } from "next/cache";

function expireTag(tag: string) {
  try {
    updateTag(tag)                      // Server Action : read-your-own-writes
  } catch {
    try {
      revalidateTag(tag, { expire: 0 }) // Route Handler (/api/rpc)
    } catch {
      // hors runtime Next (scripts, seed)
    }
  }
}
// remplacer les deux appels updateTag(...) par expireTag(...)

Test à faire : une mutation via /api/rpc, puis un get via /api/rpc, et vérifier que le résultat est frais.