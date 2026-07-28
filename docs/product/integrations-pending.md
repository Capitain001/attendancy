# Intégrations en attente

> Ajouter la valeur dans la colonne **Réponse** au fur et à mesure.
> Une fois renseignée, l'information sera intégrée dans le code (`.env`, service correspondant).

---

## INT-001 — Email / Notifications système

| Champ | Valeur |
|---|---|
| **Usage** | Alertes absentéisme, changements de planning, rappels sessions |
| **Pas concerné** | Invitations auth (Supabase gère) |
| **Options** | Resend, SendGrid, Postmark, Brevo |
| **Variables `.env` requises** | `EMAIL_FROM=`, `EMAIL_API_KEY=` |
| **Réponse** | _(à remplir)_ |

---

## INT-002 — Stockage fichiers (Documents)

| Champ | Valeur |
|---|---|
| **Usage** | Pièces jointes justifications, documents étudiants, photos profil |
| **Options** | Supabase Storage (déjà en place), S3/R2 |
| **Variables `.env` requises** | Si Supabase Storage : nom du bucket `SUPABASE_STORAGE_BUCKET=` |
| **Réponse** | _(à remplir)_ |

---

## INT-003 — Cron job (auto-clôture sessions + séances MISSED)

| Champ | Valeur |
|---|---|
| **Usage** | RULE-SES-006 : fermer les sessions oubliées après grace period. RULE-SES-008 : marquer Schedule MISSED si aucune Session ouverte. |
| **Options** | Vercel Cron (si déployé sur Vercel), Inngest, Trigger.dev, Upstash QStash |
| **Variables `.env` requises** | Selon provider choisi |
| **Fréquence recommandée** | Toutes les 15 minutes |
| **Réponse** | _(à remplir)_ |

---

## INT-004 — Web Push (notifications temps réel)

| Champ | Valeur |
|---|---|
| **Usage** | Notifications absence, planning modifié, nouveau message |
| **Modèle DB** | `PushSubscription` (en place) |
| **Variables `.env` requises** | `NEXT_PUBLIC_VAPID_PUBLIC_KEY=`, `VAPID_PRIVATE_KEY=`, `VAPID_SUBJECT=mailto:...` |
| **Génération** | `npx web-push generate-vapid-keys` |
| **Réponse** | _(à remplir)_ |

---

## INT-005 — Analytics produit (PostHog)

| Champ | Valeur |
|---|---|
| **Usage** | Session replay, funnels onboarding, error tracking |
| **Variables `.env` requises** | `NEXT_PUBLIC_POSTHOG_KEY=`, `NEXT_PUBLIC_POSTHOG_HOST=` |
| **Réponse** | _(à remplir)_ |

---

## INT-007 — Seed plans billing (à exécuter une fois)

| Champ | Valeur |
|---|---|
| **Action** | Exécuter `prisma/post-migrate/80_billing.sql` sur le projet Supabase |
| **Contenu** | Insère STARTER / STANDARD / PREMIUM — idempotent (`ON CONFLICT DO NOTHING`) |
| **Quand** | Avant le premier org-setup en production |

---

## INT-006 — Supabase (déjà configuré)

| Variable | Statut |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ |
| `DATABASE_URL` (PgBouncer port 6543) | ✅ |
| `DIRECT_URL` (port 5432) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | ✅ |
