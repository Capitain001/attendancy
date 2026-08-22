-- ============================================================
-- RPC: auth
-- Idempotent — rejouable après chaque migrate/reset
--
-- Fonctions RPC liées à auth.users, appelables uniquement en service_role
-- (createAdminClient côté appli).
-- ============================================================

-- ─── get_auth_user_by_email ───────────────────────────────────
-- Remplace un listUsers().find() côté appli (scan paginé, non fiable
-- au-delà de la 1ère page) par une lecture indexée directe sur
-- auth.users.email. Renvoie id + email_confirmed_at + raw_user_meta_data
-- en un seul aller-retour (pas de getUserById séparé après la RPC).

create or replace function get_auth_user_by_email(user_email text)
returns table (
  id uuid,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb
)
language sql
security definer
set search_path = public
as $$
  select id, email_confirmed_at, raw_user_meta_data
  from auth.users
  where email = user_email
  limit 1;
$$;

-- Sans ce verrouillage, n'importe quel rôle (anon inclus) pourrait sonder
-- l'existence d'un email et lire ses métadonnées. Seul service_role doit
-- pouvoir l'appeler.
revoke execute on function get_auth_user_by_email(text) from public, anon, authenticated;
grant execute on function get_auth_user_by_email(text) to service_role;