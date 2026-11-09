# Revue technique — drawer des invitations de classe

Document de validation du code actuel. Les chemins sont relatifs à la racine
du dépôt. Les extraits « avant » viennent de la version de référence avant les
changements concernés; les extraits « après » sont ceux du code livré.

## 1. Écran de classe : sélection et source de vérité

Fichier : [`TClassInvitationScreen.tsx`](../../apps/web/src/components/users/list/TClassInvitationScreen.tsx)

L'écran mémorise uniquement l'identifiant sélectionné. Il retrouve ensuite
l'invitation dans la liste React Query. Il n'y a plus de branche de secours
vers `revoke.variables` : la révocation ne retire plus l'invitation du cache
avant que le serveur ne confirme son succès.

Avant, la sélection devait contourner le retrait optimiste :

```tsx
const selectedInvitation =
  invitations.find((invitation) => invitation.id === selectedInvitationId) ??
  (revoke.isPending && revoke.variables?.id === selectedInvitationId
    ? revoke.variables
    : null);
```

Maintenant, elle ne peut venir que de la liste synchronisée :

```tsx
const selectedInvitation =
  invitations.find((invitation) => invitation.id === selectedInvitationId) ??
  null;
```

Le parent crée `now` une seule fois par rendu, puis passe cette même valeur au
compteur, à la liste et au drawer. Le compteur « En attente » utilise
`isInvitationPending(invitation, now)`; le statut de chaque ligne et du drawer
utilise la même policy avec ce `now`.

La liste est rendue via
[`ClassInvitationsSection.tsx`](../../apps/web/src/components/users/list/ClassInvitationsSection.tsx),
et les détails via
[`InvitationDrawer.tsx`](../../apps/web/src/components/users/list/InvitationDrawer.tsx).
L'écran parent délègue aussi la confirmation de révocation et ferme le drawer
seulement depuis le callback de succès de la mutation :

```tsx
const onRevoke = (
  invitation: InvitationListItem,
  onSuccess: () => void,
) => revoke.mutate(invitation, { onSuccess });
```

Le composant d'écran est ainsi réduit à l'assemblage de la classe, du compteur,
de la section des invitations, du drawer et de la modale d'inscription.

## 2. Drawer : détails et actions

Fichier : [`InvitationDrawer.tsx`](../../apps/web/src/components/users/list/InvitationDrawer.tsx)

Le drawer utilise `h-dvh`, `min-h-dvh` et `max-h-none` pour occuper la hauteur
du viewport. L'en-tête et le pied restent fixes; le contenu des détails défile.
Il présente l'e-mail, le nom si disponible, la classe, l'e-mail parent si
disponible, le statut, les dates d'envoi/expiration et la date de réponse.
Le rôle n'est pas affiché : cet écran concerne les invitations d'étudiants.

```tsx
<DrawerContent className="mt-0 flex h-dvh min-h-dvh max-h-none flex-col rounded-none border-0 p-0">
  {/* En-tête fixe */}
  <dl className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
    {/* Détails de l'invitation */}
  </dl>
  {/* Actions fixes : relance et révocation confirmée */}
</DrawerContent>
```

La relance manuelle et la confirmation de révocation sont conservées. Elles
sont proposées seulement quand la policy donne `PENDING` ou `EXPIRED`.
Pendant une mutation, les boutons sont désactivés et l'action en cours affiche
un indicateur de chargement.

## 3. Statut unique et présentation partagée

Policy : [`policy.ts`](../../apps/web/src/modules/invitation/policy.ts)  
Présentation : [`status.ts`](../../apps/web/src/modules/invitation/status.ts)

Avant, deux helpers résolvaient le statut, l'un en minuscules sans paramètre
temporel explicite, l'autre via la policy. La liste, le badge et le compteur
pouvaient diverger près de l'échéance.

Maintenant, les surfaces calculent leur état via :

```ts
resolveInvitationUiStatus(invitation, now)
```

`use-invitations-filter.ts` et `InvitationTable.tsx` utilisent aussi la policy;
les valeurs de filtre sont les statuts UI (`PENDING`, `ACCEPTED`, `EXPIRED`,
`DECLINED`). `status.ts` se limite à l'affichage du résultat : libellé,
description, variant du badge et un `Record` unique de classes par variant.

```ts
export const INVITATION_BADGE_CLASSES: Record<InvitationBadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  secondary: "bg-muted text-muted-foreground",
};
```

La liste et le drawer consomment ce même mapping au lieu de dupliquer le
ternaire de classes.

## 4. Mutations : échec unique et aucune mutation optimiste

Fichier : [`useInvitationMutations.ts`](../../apps/web/src/hooks/data/invitation/useInvitationMutations.ts)

Les actions serveur résolvent leur promesse même lorsqu'elles retournent
`{ success: false }`. Sans normalisation, React Query appelle donc `onSuccess`
pour ces réponses et n'appelle pas `onError`.

Le helper au `mutationFn` transforme cette réponse en rejet :

```ts
const result = await action;
if (!result.success) {
  throw new Error(result.error || fallbackMessage);
}
```

`resend`, `revoke` et `generateMagicLink` utilisent ce helper. `onError` est
l'unique chemin d'erreur; il restaure plus aucun snapshot, car aucune mutation
optimiste n'est effectuée. Pour `revoke`, il ne fait qu'afficher le toast
d'erreur. Pour `resend`, il affiche le toast sauf en mode silencieux.

La relance ne fait plus de `setQueryData` : l'échéance ne doit pas être
prédite/copiée dans le cache et `invalidate()` dans `onSettled` récupère la
valeur serveur après succès ou échec. La révocation ne retire plus
l'invitation avant confirmation serveur; elle invalide les listes dans
`onSettled`.

```ts
onError: (error) => toast.error(error.message),
onSettled: () => {
  invalidate();
  onSettled?.();
},
```

`targetKeys`, `onMutate`, snapshots, rollback et le fallback UI lié à
`revoke.variables` ont donc été supprimés.

## 5. Relance : écrire le token seulement après l'envoi réussi

Fichier : [`actions.ts`](../../apps/web/src/modules/invitation/actions.ts)
et [`supabase.ts`](../../apps/web/src/modules/invitation/supabase.ts)

Dans le chemin e-mail, l'action génère le token en mémoire et l'envoie d'abord.
Elle retourne la réponse d'échec sans enregistrer le nouveau token. La base
n'est mise à jour qu'après confirmation de succès de l'envoi :

```ts
const { token, expiresAt } = await generateInvitationToken();
const result = await resendInvitation(stored.email, {
  invitationToken: token,
});
if (!result.success) return result;

await updateInvitationToken(stored.id, token, expiresAt, orgId);
```

Le chemin existant où le destinataire possède déjà un compte est distinct :
il actualise transactionnellement la date d'expiration et la notification,
sans envoyer de nouvel e-mail.

Pour un utilisateur Supabase existant et non confirmé, `resendInvitation`
écrit aussi le nouveau `user_metadata.invitationToken`. Cette écriture a été
déplacée après le retour de succès de l'envoi : une erreur d'envoi ne modifie
donc plus les métadonnées et ne rend pas le token déjà distribué incohérent.

L'action ne renvoie plus `expiresAt` comme prédiction à appliquer au cache.
`generateMagicLinkAction` ne renvoie pas non plus cette valeur, qui n'était
pas consommée. Les actions gardent des retours inférés par TypeScript; aucun
type `Promise<InvitationActionResult>` n'est forcé.

## 6. Hook classe et relance manuelle

Fichier : [`use-class-invitations.ts`](../../apps/web/src/hooks/data/invitation/use-class-invitations.ts)

`isFetching` et `refetch` sont exposés pour le bouton de nouvelle tentative.
L'erreur de chargement est affichée dans `ClassInvitationsSection`, avec le
message disponible et un bouton désactivé pendant une nouvelle requête. La
relance manuelle est conservée comme précédemment validé.

Cette tâche ne modifie pas `inviteStudent` ni `inviteStudentsBulk` dans ce
hook; leur normalisation de `{ success: false }` reste un travail distinct.

## 7. Contrat du lien magique

Fichier : [`use-org-invitations.ts`](../../apps/web/src/hooks/data/invitation/use-org-invitations.ts)

Comme `unwrapInvitationAction` fait maintenant rejeter `mutateAsync` en cas
d'échec, le consommateur intercepte ce rejet pour interrompre le partage; le
toast est déjà géré par `onError` :

```ts
try {
  result = await generateMagicLink.mutateAsync(inv);
} catch {
  return;
}
```

## Vérifications

- Tests unitaires ciblés `policy.unit.test.ts` et `database.unit.test.ts` :
  **5 tests réussis**.
- `bun run ts:check` : toujours en échec sur trois problèmes préexistants,
  sans diagnostic dans les fichiers de cette tâche :
  `src/generated/referentiel.ts` (module `../services/personal` absent),
  `src/hooks/data/schedule/useSchedules.ts` (`orgId` absent du résultat),
  `src/services/session/actions/session.queries.ts` (`Organization.role`
  absent).
- ESLint ciblé : impossible à exécuter, car le dépôt n'a pas de fichier
  `eslint.config.*` compatible avec ESLint 9.
- `git diff --check` : aucun problème de whitespace dans les fichiers ciblés.
