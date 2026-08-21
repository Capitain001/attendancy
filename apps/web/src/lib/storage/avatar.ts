// lib/storage/avatar.ts

import { getPublicStorageUrl } from "./url";

export const AVATAR_BUCKET = "avatars";

export function getAvatarPath(userId: string): string {
  return `${userId}/avatar.png`;
}

export function getAvatarPublicUrl(filePath: string): string {
  return getPublicStorageUrl(AVATAR_BUCKET, filePath);
}


export function withCacheBusting(url: string | null | undefined, version: string | number | Date | null | undefined): string | null {
  if (!url) return null;

  const v = version instanceof Date ? version.getTime() : version;
  if (!v) return url;

  const urlObj = new URL(url);
  // Date.parse gère directement les ISO strings de Supabase (ex: "2026-08-20T10:15:00Z")
  const ts = typeof v === "string" ? Date.parse(v) : v;
  urlObj.searchParams.set("v", String(ts));
  return urlObj.toString();
}