-- =============================================================================
-- 80_billing.sql — Module billing (Plan, Subscription — schéma Postgres
--                  "billing")
--
-- AUCUN objet SQL manuel : les unicités (Plan.code, Subscription.orgId) sont
-- natives Prisma, et les transitions de statut d'abonnement sont pilotées
-- par le service (webhooks paiement) — pas de règle à ancrer en base.
--
-- Point d'ancrage pour de futurs objets du domaine facturation.
-- =============================================================================

-- Plans par défaut (PROD-004) — idempotent
INSERT INTO billing."Plan" (id, code, name, "priceMonthly", currency, features, "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'STARTER',  'Starter',  NULL,    'XOF', '{"maxStudents":500,"maxRooms":20,"maxClasses":20}',  true, now(), now()),
  (gen_random_uuid(), 'STANDARD', 'Standard', 50000,   'XOF', '{"maxStudents":2000,"maxRooms":50,"maxClasses":60}', true, now(), now()),
  (gen_random_uuid(), 'PREMIUM',  'Premium',  120000,  'XOF', '{"maxStudents":null,"maxRooms":null,"maxClasses":null}', true, now(), now())
ON CONFLICT (code) DO NOTHING;
