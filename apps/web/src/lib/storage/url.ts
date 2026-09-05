// lib/storage/url.ts

/**
 * Construit l'URL publique d'un objet dans un bucket Supabase Storage public.
 * Ne fonctionne que pour les buckets créés avec `public: true`.
 */
export function getPublicStorageUrl(bucket: string, filePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}
