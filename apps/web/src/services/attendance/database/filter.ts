// src/services/attendance/database/filter.ts
// (ou un emplacement neutre partagé si schedule/session le consomment aussi)
import { Prisma } from "@/generated/prisma/client";

/** Filtre "inscrit actif" : student non soft-deleted. */
export const activeEnrollmentWhere = {
  student: { deletedAt: null },
} satisfies Prisma.StudentEnrollmentWhereInput;

/** Filtre "membre de groupe actif"  compose la règle ci-dessus. */
export const activeGroupMemberWhere = {
  enrollment: activeEnrollmentWhere,
} satisfies Prisma.StudentGroupWhereInput;
