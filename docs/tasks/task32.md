simple exemple d implementation pas une tache a suivre a la lettre 

NB: on veux eviter un couplage de l ui a la logique metier en crant un form adapter soit dans package ui ( shared ) soit dans web 

## Décisions d'implémentation validées

- Le profil RPC complet est volontairement conservé pour cette étape ; sa projection sera restreinte dans une évolution ultérieure.
- Le formulaire de connexion est un composant de présentation dans `packages/ui` ; l'adaptateur Supabase/RPC reste dans `apps/desktop`.
- Les hooks web ne sont pas déplacés : le desktop les consomme à la source quand ils sont sans dépendance serveur incompatible.
- Les actions RPC d'appareil dérivent `userId` du Bearer vérifié. Les fonctions de capture/clôture qui acceptent un `userId` restent des helpers serveur privés et ne sont pas des Server Actions publiques.

reference :
-apps\web\src\modules\auth\rpc\actions.ts
-apps\desktop\src\lib\auth.ts

brollons issu d une disussion 

Les deux sont couverts ci-dessous, avec une réserve sur vos actions de device : **je ne peux pas les ajouter à `ACTIONS` telles quelles**.

## Pourquoi pas `captureLoginDeviceAction` et `endSessionOnLogoutAction`

Ces deux actions prennent un `userId` fourni par l'appelant et n'appellent pas `authAccess`. C'est sûr tant que seul `login.ts` les appelle. Dans `/api/rpc`, n'importe quel utilisateur authentifié pourrait envoyer l'`userId` d'un autre, enregistrer un appareil à sa place ou expirer ses sessions. Votre commentaire dit déjà de ne jamais les exposer.

On ajoute donc deux **actions RPC dédiées**. Elles déduisent l'identité du token et délèguent aux fonctions existantes.

## 1. Serveur : actions dédiées

```typescript
// src/services/device/actions/device.rpc.ts
'use server'
import { headers } from 'next/headers'
import { authAccess } from '@/services/auth'
import { getUserInfo } from '@/modules/user'
import { ERRORS } from '@/config'
import { getSessionIdFromAccessToken } from '../utils'
import { captureLoginDeviceAction, endSessionOnLogoutAction } from './device.mutations'

// userId vient du token, jamais de l'input. deviceId vient du client.
export async function registerDeviceAction(input: { deviceId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }

  const bearer = (await headers()).get('authorization')?.slice(7)
  const authSessionId = bearer ? getSessionIdFromAccessToken(bearer) ?? undefined : undefined

  return captureLoginDeviceAction({
    userId: auth.data.user.id,
    deviceId: input.deviceId,
    authSessionId,
  })
}

export async function endSessionAction(input: { deviceId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  return endSessionOnLogoutAction({ userId: auth.data.user.id, deviceId: input.deviceId })
}

// Remplace /api/auth/me. Si cette route existe encore et fait déjà ce
// qu'il faut, utilise-la à la place de cette action.
export async function getCurrentUserAction() {
  const user = await getUserInfo({ cache: false })
  if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }
  return { data: user }
}
```

Ajoute-les au barrel du service, puis au registre :

```typescript
// apps/web/src/lib/rpc/actions.ts
import { getSchedulesAction } from '@/services/schedule'
import { getClassesAction } from '@/services/class'
import { registerDeviceAction, endSessionAction, getCurrentUserAction } from '@/services/device'

export const ACTIONS = {
  getSchedulesAction, getClassesAction,
  registerDeviceAction, endSessionAction, getCurrentUserAction,
} as const
```

Relance ensuite `build:types` pour que le desktop voie les nouveaux types.

## 2. Desktop : identifiant d'appareil

Le web le tire d'un cookie via `resolveDeviceId`. Le desktop génère un UUID une fois et le garde :

```typescript
// apps/desktop/src/lib/device-id.ts
const KEY = 'attendancy-device-id'

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
```

## 3. Desktop : login et logout

`api.ts` importe `auth.ts`. Les fonctions de login qui appellent `api` doivent donc vivre dans un autre fichier, sinon l'import est circulaire. **Retire `login` et `logout` de `auth.ts`** (garde `getToken` et `getSessionState`) :

```typescript
// apps/desktop/src/lib/account.ts
import { supabase } from './supabase'
import { api } from './api'
import { getDeviceId } from './device-id'

export async function login(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return 'Email ou mot de passe incorrect'

  // best-effort, comme côté web : ne bloque jamais le login
  api.registerDeviceAction({ deviceId: getDeviceId() }).catch(() => {})
  return null
}

export async function logout() {
  // avant signOut : l'action a besoin d'un token valide. Échec toléré (hors ligne).
  await api.endSessionAction({ deviceId: getDeviceId() }).catch(() => {})
  await supabase.auth.signOut()
}
```

## 4. Desktop : profil utilisateur

```typescript
// apps/desktop/src/hooks/useMe.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

//useAuth deja present
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.getCurrentUserAction()
      if ('error' in res && res.error) throw new Error(res.error)
      return res.data!
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
```

L'erreur est levée pour que React Query garde la dernière valeur en cache quand la requête échoue.

## 5. Écran de login

```tsx
// apps/desktop/src/views/LoginView.tsx
import { useState, type FormEvent } from 'react'
import { login } from '../lib/account'

export function LoginView() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setPending(true)
    setError(null)
    const err = await login(String(form.get('email')), String(form.get('password')))
    setError(err)
    setPending(false) // en cas de succès, useAuth bascule seul sur l'app
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-semibold">Connexion</h1>
        <input name="email" type="email" required autoComplete="email" placeholder="Email"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <input name="password" type="password" required autoComplete="current-password"
          placeholder="Mot de passe"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {pending ? 'Connexion en cours…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
```

## 6. Aiguillage dans `App.tsx`

```tsx
const auth = useAuth()
const loggedIn = auth?.status === 'signed-in' || auth?.status === 'offline-stale'
const me = useMe(loggedIn)

if (!auth) return <Splash />                           // chargement
if (auth.status === 'signed-out') return <LoginView />
// signed-in et offline-stale arrivent ici : offline-stale affiche le cache
return <RouterProvider router={router} />
```

## À vérifier avant de livrer

1. **Bearer vérifié** : `getUserInfo({ cache: false })` vérifie le Bearer signé avant de fournir l'identité aux deux actions RPC de device.
2. **Format du device ID** : un UUID desktop satisfait le schéma opaque existant (`8` à `200` caractères).
3. **Isolation des appareils** : `upsertDeviceOnLogin` utilise la clé unique `(userId, deviceId)`; les mises à jour/fermetures de session sont aussi filtrées par l'utilisateur authentifié.
4. **Profil** : `getCurrentUserAction` renvoie volontairement le `UserInfo` complet pour cette itération. La projection des champs est reportée.
5. **Surface des Server Actions** : les fonctions qui prennent un `userId` sont des helpers dans `services/device/server/device-session.ts`, protégé par `server-only`; seules les façades RPC dérivent l'identité du Bearer.
6. **Flux desktop** : le composant de formulaire partagé ne connaît ni Supabase ni les actions RPC; l'adaptateur desktop porte le login, l'enregistrement best-effort de l'appareil et le logout.

## Test à ajouter

Le build/type-check valident l'intégration. Un test d'intégration avec un compte de test doit encore vérifier le rejet d'un Bearer falsifié pour chaque action, puis confirmer qu'un logout RPC n'expire que les sessions du compte associé au Bearer. Ce test requiert les identifiants de test et un serveur configuré; il n'est pas exécuté par la compilation.
