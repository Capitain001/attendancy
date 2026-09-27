PROFILE UNIQUE ACTER

On revient sur ce point, et c'est le bon réflexe — je valide sans réserve, avec une raison de plus que je veux nommer : ça évite une pollution que je n'avais pas vue venir.

Le double profil aurait fait apparaître le prof solo dans **toutes** les requêtes qui comptent des "membres DIRECTION" (santé d'org, stats plateforme, futurs filtres d'annuaire) — polluant ces métriques avec des comptes qui ne sont "direction" de rien. En gardant `role: TEACHER` seul, ce risque disparaît entièrement, et bonus : la navigation par rôle (`/teacher/*` vs `/direction/*`) reste sans ambiguïté, sans cas particulier à gérer.

Le vrai déplacement, c'est où vit l'autorisation : pas dans `getAuthorization()`/`ROLE_HIERARCHY` (ça élargirait TEACHER partout, y compris dans les vraies universités — dangereux), mais dans un **service dédié et étroit**, appelé uniquement par les actions du module "org perso" :

```ts
// src/services/personal-org/access.ts — nouveau, isolé, pas dans auth/permission
async function personalOrgAccess(orgId: string) {
  const user = await getAuthUser() // pas de contrainte d'org générique
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { type: true } })
  if (org?.type !== 'PERSONAL') return { error: ERRORS.AUTH.FORBIDDEN }

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
    select: { role: true },
  })
  if (membership?.role !== 'TEACHER') return { error: ERRORS.AUTH.FORBIDDEN }

  return { data: { user, orgId } }
}
```

Conséquence importante à noter pour l'implémentation : les actions du module perso (`createPersonalClassAction`, etc.) ne doivent **jamais** réutiliser les server actions institutionnelles existantes (`createClassAction`, `createScheduleAction`...) puisqu'elles sont câblées sur `authAccess({ requiredRole: 'DIRECTION' })`. Elles doivent appeler directement les fonctions de la couche `database/` des domaines propriétaires (`createClass`, `createSchedule`...) — exactement le principe §1 de `SERVICE_CONTEXT.md` (réutiliser la donnée du propriétaire, pas sa couche d'autorisation pensée pour un autre contexte).

Je mets à jour le document avec ça, plus le routing, le mécanisme d'activation/désactivation, et la terminologie.Maintenant je nettoie les questions ouvertes — 3 des 4 sont réglées, il ne reste que la vraie inconnue technique (synchro billing) et l'anti-abus explicitement différé.Document mis à jour. Tout est acté sauf trois points listés en §6, dont deux sont explicitement non-bloquants (synchro billing, anti-abus différé) — seul le slug technique de l'org perso (§6.3) mérite d'être tranché avant d'écrire le service de bootstrap.

Un seul ajout de schéma reste identifié : `Class.isActive Boolean @default(true)` (§3.3) — dis-moi si tu veux l'ajouter toi-même comme pour `Organization.type`, ou si tu veux que je prépare le diff avec la garde SQL correspondante (même mécanique que `40_schedule.sql`/`90_fees.sql` : `count(classes actives) ≤ maxClasses` peut rester applicatif, cohérent avec le reste du projet, donc pas de trigger nécessaire ici).