<!-- src/features/personal/ -->
# Feature `personal`

## Rôle

Parcours **espace personnel** (`OrganizationType.PERSONAL`) : un enseignant indépendant
utilise le moteur institutionnel (Class, Course, Schedule, Attendance...) à travers un
mini-parcours simplifié, sans le vocabulaire ni la structure institutionnels
(pas de `level`, classes nommées librement).

C'est une **feature** (zone verticale du produit), pas un service ni un orchestrateur :
elle embarque ses propres services, constantes et helpers. Le reste du projet ne dépend
jamais d'elle.

> Statut : architecture en cours de pose. Le contenu historique est encore dans
> `src/services/personal/` et `src/modules/personal/` ; il migre ici au fil de l'usage.

---

## Fichiers

| Fichier / dossier | Rôle |
|---|---|
| `constants.ts` | `PERSONAL`, `PERSONAL_LABEL`... **seule** source des constantes perso |
| `paths.ts` | URLs du parcours (`/personal/[slug]/...`) |
| `auth.ts` | Garde et résolution d'accès propres au parcours |
| `utils.ts` | Fonctions pures partagées par les services de la feature |
| `index.ts` | Barrel public (actions, types, utilitaires client-safe) |


Layout d'un service de la feature : identique à `src/services/<service>/`
(`actions/`, `database/`, `validation.ts`, `types.ts`, `index.ts`).

UI : `src/components/personal/` (regroupement à faire, aujourd'hui dispersée).
Routes : `src/app/(app)/personal/[slug]/...`.

---

## Règles

1. **Frontière unique.** `src/services/**` et `src/modules/**` n'importent jamais
   `@/features/personal`. La feature importe les services par `@/services/<x>`.
2. **Service de la feature = nom d'un modèle.** Son `database/` contient ce que le service
   owner (`src/services/<modèle>/`) ne sait pas faire. Ce que l'owner sait faire, la feature
   le **réutilise** (flag `allowPersonalOrg` d'`authAccess`), elle ne le réécrit pas.
3. **Orchestration = nom d'usage.** Une fonction qui fusionne plusieurs sources vit dans un
   dossier nommé par son usage (ex. `report/`), jamais dans un dossier générique
   (`bootstrap/`, `orchestrator/`). Prisma multi-modèles y est permis (transaction ou lecture
   de composition), avec un contrat de retour défini.
4. **Cache.** Tags de l'owner (`CACHE.CLASS(orgId)`...) et événements existants.
   Pas de `GRAPH` propre tant que la feature ne possède aucune donnée.
5. **Nommage.** Les fonctions de la feature portent `Personal` (`updatePersonalClass`) pour
   ne jamais entrer en collision avec leurs équivalents institutionnels.
6. **`server.ts` chez un owner** : seulement si un besoin réel se confirme
   (voir `docs/techs/module-server-entrypoints.md`).
7. `orgId` vient toujours du token. Actions perso : `requiredOrgType: 'PERSONAL'` + rôle.

---

## Invariants métier


---

## Points d'extension / à venir


---

## Checklist avant d'ajouter du code

- [ ] L'owner (`src/services/<modèle>/`) sait-il déjà faire ? Alors réutiliser, pas réécrire.
- [ ] Un seul modèle → `services/<modèle>/` ; plusieurs sources → dossier nommé par usage.
- [ ] Les constantes perso sont-elles dans `constants.ts` (et nulle part ailleurs) ?
- [ ] Aucun import de `@/features/personal` depuis `src/services/**` ou `src/modules/**` ?
- [ ] Ce `CLAUDE.md` reflète-t-il encore la réalité après la modification ?