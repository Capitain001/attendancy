// src/services/parent-relation/database/parent-relation.mutations.unit.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { ensureParentRelation } from "./parent-relation.mutations";

describe("ensureParentRelation", () => {
  const params = {
    parentId: "parent-1",
    studentId: "student-1",
    relation: "Guardian",
    orgId: "org-1",
  };

  let upsert: ReturnType<typeof vi.fn>;
  let client: Pick<Prisma.TransactionClient, "parentRelation">;

  beforeEach(() => {
    upsert = vi.fn().mockResolvedValue({ id: "relation-1" });
    client = {
      parentRelation: { upsert },
    } as unknown as Pick<Prisma.TransactionClient, "parentRelation">;
  });

  it("crée le lien sur la clé unique parent-étudiant sans modifier un lien existant", async () => {
    const result = await ensureParentRelation(client, params);

    expect(upsert).toHaveBeenCalledWith({
      where: {
        parentId_studentId: {
          parentId: params.parentId,
          studentId: params.studentId,
        },
      },
      create: params,
      update: {},
      select: { id: true },
    });
    expect(result).toEqual({ id: "relation-1" });
  });
});
