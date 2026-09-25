# Pattern : `toEntityPatch`

Option de `useCrudEntity` (`hooks/entity/useCrudEntity.ts`). Premier usage :
`services/teacher-unavailability` (`toUnavailabilityEntityPatch`, branché dans
`hooks/data/teacher-unavailability/useTeacherUnavailabilities.ts`).

## Le problème que ça résout

`useCrudEntity` met à jour le cache React Query dans `onSuccess`, pas dans
`onMutate` : pas de vraie mutation optimiste (avant requête), mais un patch
posé dès que le serveur confirme, sans attendre le prochain refetch complet.
Ce patch fusionne trois couches, priorité croissante :

```
{ ...createDefaults, ...toEntityPatch?.(variables) ?? variables, ...serverResponse }
```

`serverResponse` est volontairement partiel : les mutations ne renvoient que
ce que le serveur seul peut produire ou doit confirmer (`id`, des valeurs
recalculées, des compteurs relationnels…), pas ce que l'UI connaît déjà.
Sans `toEntityPatch`, la couche du milieu est `variables` **brut** — la forme
"écriture" du formulaire (`CreateInput`/`UpdateInput`), pas la forme
"lecture" de l'entité (`T`).

Tant que `CreateInput`/`UpdateInput` sont structurellement un `Partial<T>`,
ça ne pose pas de problème : les clés brutes sont déjà les bonnes. Le
problème apparaît dès qu'un champ de formulaire n'a pas la forme d'une
colonne de l'entité — un champ groupé qui se décompose en plusieurs colonnes,
un champ dérivé d'un autre plutôt que saisi directement, un renommage. Dans
ce cas :
- le champ "écriture" pollue le cache (il n'existe pas sur `T`, mais rien
  n'empêche TypeScript de le laisser passer via le cast `as unknown as T`) ;
- le(s) champ(s) "lecture" qu'il était censé représenter restent absents ou
  périmés, jusqu'au prochain refetch complet.

## Le principe

`toEntityPatch` convertit `CreateInput | UpdateInput` → `Partial<T>` **avant**
le merge. Règle : ne pas dupliquer cette traduction — réutiliser la fonction
qui produit déjà les colonnes côté écriture DB. Les deux doivent rester en
phase mécaniquement (même fonction), pas par discipline (deux fonctions à
garder synchronisées à la main).

```ts
// Écriture DB (service, ex: createXxx/updateXxx)
...resolveXxxFields(data)

// Cache client (toEntityPatch)
export function toXxxEntityPatch(data: CreateXxxInput | UpdateXxxDataInput): Partial<XxxItem> {
  return {
    // champs qui ne demandent aucune traduction (renommage, décomposition…)
    someDirectField: data.someDirectField ?? null,
    ...resolveXxxFields(data), // même fonction que côté DB
  };
}
```

Condition pour que ce soit sûr : `resolveXxxFields` doit être un module
client-safe (pas de `"use server"`, pas de dépendance serveur-only) — la
plupart des `resolveXxxFields` qui ne font que de la traduction pure de forme
(pas d'accès DB) le sont déjà.

## Cas concret : `teacher-unavailability`

Le formulaire envoie `timeRange: { start, end }` en `"HH:mm"`. L'entité
affichée (`TeacherUnavailabilityItem`) a des colonnes `startTime`/`endTime`
en `Date`, plus un `type` dérivé de `dayOfWeek` (pas saisi directement).

Sans mapper : `variables` brut fusionné → `type`/`dayOfWeek` absents du
patch (aucune des deux sources ne les porte sous la bonne forme), `timeRange`
pollue le cache sans jamais devenir `startTime`/`endTime`. Les mutations
(`createTeacherUnavailability`/`updateTeacherUnavailability`) ne renvoient
que `{ id, teacherId, startTime, endTime }` — volontairement minimal, le
reste étant censé venir de l'UI — donc rien ne comble le trou avant le
prochain fetch complet.

Fix : `toUnavailabilityEntityPatch` (`services/teacher-unavailability/utils.ts`)
réutilise `resolveUnavailabilityFields`, la même fonction que
`createTeacherUnavailability`/`updateTeacherUnavailability` appellent pour
écrire les colonnes. Le patch de cache et l'écriture DB sont donc
mécaniquement la même traduction `dayOfWeek/startDate/endDate/timeRange →
type/dayOfWeek/startDate/endDate/startTime/endTime`.

## Quand l'ajouter

- Par défaut, ne pas ajouter `toEntityPatch` : le comportement sans lui
  (merge des `variables` brutes) est correct dès que `CreateInput`/
  `UpdateInput` sont déjà structurellement un `Partial<T>`.
- L'ajouter dès qu'un champ de formulaire n'a pas une forme 1:1 avec une
  colonne de l'entité — c'est le signal, pas une préférence de style.
- L'implémenter en réutilisant la fonction de résolution DB existante, jamais
  en réécrivant la traduction une seconde fois.
