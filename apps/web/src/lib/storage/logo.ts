// lib/storage/logo.ts
import { getPublicStorageUrl } from "./url";

export const LOGO_BUCKET = "logos";

export function getLogoPath(organizationId: string): string {
  return `organizations/${organizationId}/logo.png`;
}

export function getLogoPublicUrl(filePath: string): string {
  return getPublicStorageUrl(LOGO_BUCKET, filePath);
}