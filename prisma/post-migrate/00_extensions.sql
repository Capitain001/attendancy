-- =============================================================================
-- 00_extensions.sql — Extensions Postgres
-- Prérequis de TOUS les modules suivants :
--   btree_gist → contraintes d'exclusion mixtes (= sur uuid + && sur range)
--                utilisées par 40_schedule.
--   postgis    → colonnes geography + calculs de distance (géofencing)
--                utilisés par 40_schedule (Location) et 50_attendance (Session).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS postgis;
