//src/services/auth/persmission/config.ts
import type { Role } from "@/services/user/types";

export const ROLE_HIERARCHY: Partial<Record<Role, Role[]>> = {
    ADMIN:     ["ADMIN"],
    TEACHER:   ["TEACHER", "ADMIN"],
    STUDENT:   ["STUDENT", "ADMIN"],
    DIRECTION: ["DIRECTION", "ADMIN"],
    PARENT:    ["PARENT", "ADMIN"],
    GUEST:     ["GUEST", "ADMIN"],
  } as const;
