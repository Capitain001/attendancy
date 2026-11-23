// src/services/user/utils.ts
import { STATUS_LABEL } from "./constants";
import type { UserStatus } from "@attendancy/user";


export function getStatusLabel(status?: UserStatus): string {
  return status ? STATUS_LABEL[status] : "—";
}
