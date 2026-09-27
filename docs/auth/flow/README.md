# Auth Flow — Attendancy

> Le flow auth est **solide et fonctionnel**.
> Ne pas le remettre en cause sans raison valable.
> Chaque fichier documente le flow complet d'un rôle.

## Fichiers

| Fichier | Rôle concerné | Statut |
|---|---|---|
| [direction.md](./direction.md) | DIRECTION / PRINCIPAL | ✅ documenté |
| [invite.md](./invite.md) | Utilisateur invité (TEACHER, STUDENT, PARENT, GUEST) | 🔜 à documenter |

## Conventions

- Les fonctions sont liées directement à leur fichier + ligne.
- Les chemins sont relatifs à la racine du monorepo (`attendancy/`).
- Sentinel de profil complet : `prisma.user.dateOfBirth` (voir `checkUserProfile()`).
- Hub de routage universel post-action : `/auth/redirect` (voir `redirect/page.ts`).