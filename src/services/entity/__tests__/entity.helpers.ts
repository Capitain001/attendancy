// src/services/entity/__tests__/entity.helpers.ts
// ═══════════════════════════════════════════════════════════════════════════
// RÉFÉRENCE COMMENTÉE — helpers de test d'intégration d'un service.
// Convention : les tests vivent à côté du code (*.unit.test.ts /
// *.integration.test.ts), les helpers partagés du service dans __tests__/.
// Prérequis intégration : npm run test:db:setup (base TEST_DATABASE_URL).
// ═══════════════════════════════════════════════════════════════════════════
//
// import { prisma } from '@/lib/db'
//
// // Fabrique un tenant isolé pour le test — chaque test crée SES données,
// // aucune dépendance à un état pré-existant.
// export async function createTestOrg() {
//   return prisma.organization.create({
//     data: { name: `test-org-${Date.now()}`, slug: `test-${crypto.randomUUID()}` },
//     select: { id: true, slug: true },
//   })
// }
//
// export async function createTestEntity(orgId: string, overrides = {}) {
//   return prisma.entity.create({
//     data: { orgId, name: `test-entity-${Date.now()}`, ...overrides },
//     select: { id: true },
//   })
// }
//
// // Nettoyage par tenant — à appeler en afterAll.
// export async function cleanupTestOrg(orgId: string) {
//   await prisma.entity.deleteMany({ where: { orgId } })
//   await prisma.organization.delete({ where: { id: orgId } })
// }

export {}
