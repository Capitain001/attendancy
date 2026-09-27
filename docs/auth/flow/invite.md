# Flow INVITE — TEACHER / STUDENT / PARENT / GUEST

> Un utilisateur invite est cree par la direction depuis le panel admin.
> Il n'a pas acces a la page `/auth/signup/principal`.
> Son compte Supabase Auth est cree automatiquement via un lien d'invitation.

---

## A documenter

Ce fichier est reserve au flow des utilisateurs invites.
Collaborer avec l'equipe pour documenter les etapes suivantes :

- Creation de l'invitation par la direction
- Generation du lien d'invitation (magic link via `supabase.auth.admin.generateLink`)
- Acceptation de l'invitation (`/auth/invite?token=...`)
- Completion du profil
- Redirect vers `/{orgSlug}/{role}`

Voir le callback actuel :
[apps/web/src/app/auth/callback/route.ts](../../../apps/web/src/app/auth/callback/route.ts)
(condition `if (inviteToken)` ligne 25)