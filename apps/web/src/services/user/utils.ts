import { STATUS_LABEL } from "./constants";
import type { UserStatus } from "@/types/user";


export function getStatusLabel(status?: UserStatus): string {
  return status ? STATUS_LABEL[status] : "—";
}