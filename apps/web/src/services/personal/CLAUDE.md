# Service `personal`

## Rôle

Compose les actions des services propriétaires pour les parcours autonomes
d'une organisation personnelle. Ce service ne possède aucun modèle Prisma.

## Fichiers

| Fichier | Rôle |
|---|---|
| `actions/teacher.mutations.ts` | Démarrage de l'espace professeur, ajout, renommage et archivage des classes personnelles ; `createPersonalCourseAction` — orchestration UE → UECourse → Course → CourseTeacher(self) pour créer un cours dans l'espace perso |
| `actions/index.ts` | Barrel des actions serveur |
| `index.ts` | API publique du service |

## Invariants

- Aucune requête Prisma ni import de `database/` d'un autre service.
- L'action orchestre uniquement des actions publiques de services propriétaires.
- `orgId` reste dérivé du contexte d'authentification, jamais d'une entrée client.
- `allowPersonalOrg: true` est opt-in et ne donne accès qu'au professeur de son organisation personnelle.
- Les mutations de classe et le quota restent possédés et appliqués par `class` et `organization`.