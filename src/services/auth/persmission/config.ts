//src/services/auth/persmission/config.ts
import type { Role } from "@/services/user/types";

export const ROLE_HIERARCHY: Partial<Record<Role, Role[]>> = {
    ADMIN:      ["ADMIN"],
    SUPER_ADMIN:["SUPER_ADMIN", "ADMIN"],
    TEACHER:    ["TEACHER", "ADMIN"],
    STUDENT:    ["STUDENT", "ADMIN"],
    DIRECTION:  ["DIRECTION", "ADMIN"],
    PARENT:     ["PARENT", "ADMIN"],
  } as const;
