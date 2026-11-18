La règle correcte demande de connaître l’ordre des messages, donc elle ne peut pas être générique dans useEntity. L’option devient une fonction reconcileOnRefetch plutôt qu’un booléen :

ts
// useEntity.ts
export interface UseEntityOptions<T> {
  // ...
  /**
   * Réconcilie le cache existant avec le résultat frais d'un refetch.
   * Par défaut, le frais remplace tout. Pour les flux cumulatifs (historique paginé).
   */
  reconcileOnRefetch?: (existing: T[], fresh: T[]) => T[];
}

queryFn: async () => {
  if (!fetchFn) return [] as T[];
  const fresh = await fetchFn(initialParams);
  if (!reconcileOnRefetch) return fresh;
  // Lu APRÈS l'await : les pages chargées pendant le fetch sont prises en compte
  const existing = queryClient.getQueryData<T[]>(queryKey);
  return existing?.length ? reconcileOnRefetch(existing, fresh) : fresh;
},

Le cache brut est toujours un tableau (queryFn renvoie T[] et applyPayload conserve cette forme), donc la branche old.items du document est inutile ici. Contrairement à transformFn, cette fonction n’a pas besoin d’être stable, car React Query relit le queryFn courant.

La règle pour les messages, avec MESSAGES_PAGE_SIZE importé :

ts
// hooks/data/chat/utils.ts
type Dto = GetMessagesDto[number]

const compare = (a: Dto, b: Dto) =>
  a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

export function reconcileMessages(existing: Dto[], fresh: Dto[]): Dto[] {
  // Fenêtre non pleine : elle contient tout le canal, le serveur fait foi
  if (fresh.length < MESSAGES_PAGE_SIZE) return fresh
  // Aucun message en commun : des messages ont pu arriver entre les deux, fusionner
  // laisserait un trou. On repart de la fenêtre fraîche.
  const freshIds = new Set(fresh.map((m) => m.id))
  if (!existing.some((m) => freshIds.has(m.id))) return fresh
  // Dans la fenêtre : le serveur fait foi (éditions, suppressions).
  // En dessous : on conserve l'historique déjà chargé.
  const oldest = fresh.reduce((min, m) => (compare(m, min) < 0 ? m : min))
  return [...existing.filter((m) => compare(m, oldest) < 0).sort(compare), ...fresh]
}

Dans useMessages : reconcileOnRefetch: reconcileMessages. La logique suppose que fresh arrive en ordre croissant, ce que fait déjà getMessages avec son reverse(). Le cas « pas de chevauchement » réinitialise les pages antérieures chez l’utilisateur, ce qui est la bonne dégradation : l’historique se recharge en remontant.

2. Le curseur ne doit pas venir de messages[0]

Dans loadOlderMessages du document, messages est la liste fusionnée de useChat, qui contient aussi les messages en sending et les messages temps réel, dont la date vient du client. Le curseur doit venir du cache persisté, comme je l’écrivais plus haut. Et comme le cache n’est pas garanti trié, on prend le minimum par (createdAt, id), pas l’index 0.

3. loadOlder appartient à useMessages

Il lit et écrit le cache, il appelle l’action : c’est de la couche données. useChat ne fait que l’exposer, avec la forme que tu proposes (hasMore, loadOlderMessages, isLoadingOlder). Le document écrit aussi le cache avec ['messages', { channelId }] en dur, ce qui duplique la construction de la clé dans useEntity. Une petite méthode évite ça :

ts
// useEntity.ts, à ajouter au retour
const updateItems = (updater: (items: T[]) => T[]) =>
  queryClient.setQueryData<T[]>(queryKey, (old) => (old ? updater(old) : old));
ts
// useMessages.ts ou exposer un hook qui fusionne avec useMessage 
const loadingRef = useRef(false)              // garde synchrone (le state arrive trop tard)
const [isLoadingOlder, setIsLoadingOlder] = useState(false)
const [exhaustedAt, setExhaustedAt] = useState<string | null>(null)

const items = entity.data.items
const oldest = useMemo(
  () => items.reduce<Dto | undefined>((min, m) => (!min || compare(m, min) < 0 ? m : min), undefined),
  [items],
)
// hasMore dérivé : si le cache est réinitialisé (cas « pas de chevauchement »),
// l'id le plus ancien change et hasMore redevient vrai, sans effet de reset
const hasMore = items.length >= MESSAGES_PAGE_SIZE && oldest?.id !== exhaustedAt

const loadOlder = useCallback(async () => {
  if (loadingRef.current || !hasMore || !oldest) return
  loadingRef.current = true
  setIsLoadingOlder(true)
  try {
    const res = await getOlderMessagesAction({
      channelId,
      before: { createdAt: oldest.createdAt.toISOString(), id: oldest.id },
    })
    if (!res.data) { toast.error(res.error ?? 'Impossible de charger les messages'); return }

    let applied = false
    entity.updateItems((current) => {
      // Si le curseur a disparu (refetch avec réinitialisation entre-temps),
      // ajouter cette page créerait un trou : on l'ignore.
      applied = current.some((m) => m.id === oldest.id)
      return applied ? mergeItemsById(res.data.items, current) : current
    })
    if (applied && !res.data.hasMore) setExhaustedAt(res.data.items[0]?.id ?? oldest.id)
  } finally {
    loadingRef.current = false
    setIsLoadingOlder(false)
  }
}, [channelId, hasMore, oldest, entity])

Dans mergeItemsById(res.data.items, current), le cache courant passe en second et l’emporte donc sur la page antérieure, ce qui est le bon sens (version plus fraîche). La fonction doit être exportée de useEntity.ts. Je la réécrirais aussi avec une Map, car le findIndex imbriqué fait de l’ordre de 25 millions de comparaisons à chaque fusion avec 5 000 messages. La sémantique est identique, y compris la position conservée à l’écrasement :

ts
export function mergeItemsById<T extends { id: string }>(oldItems: T[], newItems: T[]): T[] {
  const byId = new Map(oldItems.map((item) => [item.id, item]));
  for (const item of newItems) byId.set(item.id, item);
  return [...byId.values()];
}
