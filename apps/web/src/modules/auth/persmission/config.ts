//src/services/auth/persmission/config.ts
import { Role } from "@/types";

export const ROLE_HIERARCHY: Record<Role, Role[]> = {
    ADMIN: ["ADMIN"],
    TEACHER: ["TEACHER", "ADMIN"],
    STUDENT: ["STUDENT", "ADMIN"],
    DIRECTION: ["DIRECTION", "ADMIN"],
    PARENT: ["PARENT", "ADMIN"],
    GUEST: ["GUEST", "ADMIN"],
  } as const;
