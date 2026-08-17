// // src/services/parent/__tests__/parentRelation.integration.test.ts
// //
// // Lot 4 — assignation/retrait parent + recherche éligibles (owner parent).
// // Scope org par les extrémités (P-19), audit, idempotence unique, hard-delete tracé.

// import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

// import { prisma } from "@/lib/prisma";
// import {
//   createParentRelationWithAudit,
//   deleteParentRelationWithAudit,
//   searchEligibleParents,
// } from "../database";
// import {
//   cleanupStudents,
//   resetStudentsMutable,
//   seedStudents,
//   type StudentsSeedIds,
// } from "@/services/__tests__/students.helpers";

// let ids: StudentsSeedIds;

// beforeAll(async () => {
//   ids = await seedStudents(prisma);
// }, 30_000);

// afterEach(async () => {
//   if (ids) await resetStudentsMutable(ids, prisma);
// });

// afterAll(async () => {
//   if (ids) await cleanupStudents(ids, prisma);
//   await prisma.$disconnect();
// }, 30_000);

// const auditCount = (event: string) =>
//   prisma.auditLog.count({
//     where: { orgId: ids.orgId, details: { path: ["event"], equals: event } },
//   });

// describe("createParentRelationWithAudit — intégration", () => {
//   it("lie un parent et écrit l'audit PARENT_LINKED", async () => {
//     const { relationId } = await createParentRelationWithAudit({
//       orgId: ids.orgId,
//       parentId: ids.parentId,
//       studentId: ids.studentId,
//       relation: "Mère",
//       actorUserId: ids.teacherUserId,
//     });

//     const rel = await prisma.parentRelation.findUnique({
//       where: { id: relationId },
//     });
//     expect(rel?.relation).toBe("Mère");
//     expect(rel?.parentId).toBe(ids.parentId);
//     expect(rel?.orgId).toBe(ids.orgId);
//     expect(rel?.deletedAt).toBeNull();
//     expect(await auditCount("PARENT_LINKED")).toBe(1);
//   });

//   it("doublon (@@unique) → throw, pas de 2e audit", async () => {
//     await createParentRelationWithAudit({
//       orgId: ids.orgId,
//       parentId: ids.parentId,
//       studentId: ids.studentId,
//       relation: "Mère",
//       actorUserId: ids.teacherUserId,
//     });

//     await expect(
//       createParentRelationWithAudit({
//         orgId: ids.orgId,
//         parentId: ids.parentId,
//         studentId: ids.studentId,
//         relation: "Mère",
//         actorUserId: ids.teacherUserId,
//       }),
//     ).rejects.toThrow(/déjà lié/);

//     expect(await auditCount("PARENT_LINKED")).toBe(1);
//   });

//   it("parent d'une autre org → throw, rien créé", async () => {
//     await expect(
//       createParentRelationWithAudit({
//         orgId: ids.orgId,
//         parentId: ids.extParentId, // parent membre de org2 uniquement
//         studentId: ids.studentId,
//         relation: "Tuteur",
//         actorUserId: ids.teacherUserId,
//       }),
//     ).rejects.toThrow();

//     const count = await prisma.parentRelation.count({
//       where: { studentId: ids.studentId },
//     });
//     expect(count).toBe(0);
//   });
// });

// describe("deleteParentRelationWithAudit — intégration", () => {
//   it("retire la relation (hard-delete) + audit PARENT_UNLINKED", async () => {
//     const { relationId } = await createParentRelationWithAudit({
//       orgId: ids.orgId,
//       parentId: ids.parentId,
//       studentId: ids.studentId,
//       relation: "Mère",
//       actorUserId: ids.teacherUserId,
//     });

//     await deleteParentRelationWithAudit({
//       orgId: ids.orgId,
//       relationId,
//       actorUserId: ids.teacherUserId,
//     });

//     // Soft-delete (A-XX) : la ligne reste, deletedAt renseigné.
//     const row = await prisma.parentRelation.findUnique({
//       where: { id: relationId },
//     });
//     expect(row).not.toBeNull();
//     expect(row?.deletedAt).not.toBeNull();
//     expect(await auditCount("PARENT_UNLINKED")).toBe(1);
//   });

//   it("relink possible après soft-delete (index unique partiel)", async () => {
//     const first = await createParentRelationWithAudit({
//       orgId: ids.orgId,
//       parentId: ids.parentId,
//       studentId: ids.studentId,
//       relation: "Mère",
//       actorUserId: ids.teacherUserId,
//     });
//     await deleteParentRelationWithAudit({
//       orgId: ids.orgId,
//       relationId: first.relationId,
//       actorUserId: ids.teacherUserId,
//     });

//     // Re-création du même couple : autorisée (la ligne soft-deletée ne bloque plus).
//     const second = await createParentRelationWithAudit({
//       orgId: ids.orgId,
//       parentId: ids.parentId,
//       studentId: ids.studentId,
//       relation: "Tuteur",
//       actorUserId: ids.teacherUserId,
//     });

//     expect(second.relationId).not.toBe(first.relationId);
//     const active = await prisma.parentRelation.findMany({
//       where: { parentId: ids.parentId, studentId: ids.studentId, deletedAt: null },
//     });
//     expect(active).toHaveLength(1);
//     expect(active[0].relation).toBe("Tuteur");
//   });

//   it("relationId d'une autre org → throw, relation intacte", async () => {
//     const { relationId } = await createParentRelationWithAudit({
//       orgId: ids.orgId,
//       parentId: ids.parentId,
//       studentId: ids.studentId,
//       relation: "Mère",
//       actorUserId: ids.teacherUserId,
//     });

//     await expect(
//       deleteParentRelationWithAudit({
//         orgId: ids.org2Id, // extrémités hors org2
//         relationId,
//         actorUserId: ids.teacherUserId,
//       }),
//     ).rejects.toThrow();

//     const row = await prisma.parentRelation.findUnique({
//       where: { id: relationId },
//     });
//     expect(row).not.toBeNull();
//     expect(row?.deletedAt).toBeNull(); // toujours active
//   });
// });

// describe("searchEligibleParents — intégration", () => {
//   it("ne renvoie que des PARENT de l'org", async () => {
//     const res = await searchEligibleParents({ orgId: ids.orgId, query: "Parent" });
//     const orgParentIds = res.map((p) => p.parentId);
//     expect(orgParentIds).toContain(ids.parentId);
//     expect(orgParentIds).toContain(ids.parent2Id);
//     expect(orgParentIds).not.toContain(ids.extParentId); // org2
//   });

//   it("filtre par nom/email", async () => {
//     const res = await searchEligibleParents({ orgId: ids.orgId, query: "Alpha" });
//     expect(res.map((p) => p.parentId)).toEqual([ids.parentId]);
//   });

//   it("exclut les parents déjà liés à l'étudiant (excludeStudentId)", async () => {
//     await createParentRelationWithAudit({
//       orgId: ids.orgId,
//       parentId: ids.parentId,
//       studentId: ids.studentId,
//       relation: "Mère",
//       actorUserId: ids.teacherUserId,
//     });

//     const res = await searchEligibleParents({
//       orgId: ids.orgId,
//       query: "Parent",
//       excludeStudentId: ids.studentId,
//     });
//     const orgParentIds = res.map((p) => p.parentId);
//     expect(orgParentIds).not.toContain(ids.parentId);
//     expect(orgParentIds).toContain(ids.parent2Id);
//   });
// });
