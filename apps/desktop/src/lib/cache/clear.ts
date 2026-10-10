//apps\desktop\src\lib\cache\clear.ts
import { get, set } from 'idb-keyval'
import { queryClient } from './client'
import { queryPersister } from './persister'

const OWNER_KEY = 'attendancy-cache-owner'

//a appeller au logout
export async function clearLocalData() {
  queryClient.clear()
  await queryPersister.removeClient()
}

// Même utilisateur : le cache est gardé. Autre utilisateur sur le même appareil : on repart de zéro.
export async function claimLocalData(userId: string) {
  const owner = await get<string>(OWNER_KEY)
  if (owner && owner !== userId) await clearLocalData()
  await set(OWNER_KEY, userId)
}