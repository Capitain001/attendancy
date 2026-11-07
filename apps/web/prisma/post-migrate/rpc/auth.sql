-- ============================================================
-- RPC: auth
-- Idempotent — rejouable après chaque migrate/reset
-- TEST_DB_SKIP: dépend du schéma auth géré par Supabase, absent d'une DB Prisma isolée.
--
-- Fonctions RPC liées à auth.users, appelables uniquement en service_role
-- (createAdminClient côté appli).
-- ============================================================

-- ─── get_auth_user_by_email ───────────────────────────────────
-- Remplace un listUsers().find() côté appli (scan paginé, non fiable
-- au-delà de la 1ère page) par une lecture indexée directe sur
-- auth.users.email. Renvoie id + email_confirmed_at + les deux metadata
-- (user et app) en un seul aller-retour, sans getUserById après la RPC.
--
-- L'email doit être normalisé côté appli (trim + lowercase) : un lower()
-- en SQL empêcherait l'usage de l'index.
--
-- drop avant create : changer les colonnes de retour fait échouer
-- create or replace ("cannot change return type"), le drop garde le
-- fichier rejouable.

drop function if exists public.get_auth_user_by_email(text);

create function public.get_auth_user_by_email(user_email text)
returns table (
  id uuid,
  email_confirmed_at timestamptz,
  app_metadata jsonb,
  user_metadata jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    u.id,
    u.email_confirmed_at,
    u.raw_app_meta_data  as app_metadata,
    u.raw_user_meta_data as user_metadata
  from auth.users u
  where u.email = user_email
  limit 1;
$$;

-- Sans ce verrouillage, n'importe quel rôle (anon inclus) pourrait sonder
-- l'existence d'un email et lire ses métadonnées. Seul service_role doit
-- pouvoir l'appeler.
revoke execute on function public.get_auth_user_by_email(text) from public, anon, authenticated;
grant execute on function public.get_auth_user_by_email(text) to service_role;