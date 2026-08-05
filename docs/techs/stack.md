# Stack cible — Attendancy

Stack actuelle et cible de migration. Référence pour toute décision d'architecture,
de dépendance, ou de stratégie offline/cross-platform.

---

## Stack actuelle (web)

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (PPR — `cacheComponents: true`) |
| Runtime serveur | Node.js |
| React | React 19 |
| Base de données | Prisma v7 multi-schema (adapter pg) |
| Auth | Supabase Auth |
| Style | Tailwind v4 + shadcn/ui + base-ui |
| Validation | Valibot |
| Tests | Vitest |
| Langage | TypeScript strict |

---

## Stack cible (migration)

### Web — Next.js + Bun

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js (PPR conservé) |
| Runtime serveur | **Bun** (remplace Node.js) |
| Base de données | Prisma (inchangé) |
| Auth | Supabase Auth (inchangé) |

Bun est drop-in compatible Node.js pour Next.js. Gain : démarrage serveur,
`bun install`, scripts TypeScript natifs sans `tsx`.

### Mobile — Tauri v2 (ou Expo)

| Couche | Technologie |
|--------|-------------|
| Option A | **Tauri v2 mobile** (gen/android + gen/apple) — même app Vite que desktop |
| Option B | **Expo** (React Native) — codebase séparée |
| Offline data | React Query + IndexedDB persister (Tauri) ou AsyncStorage (Expo) |
| Auth | Supabase Auth via cookie (Tauri) ou SDK React Native (Expo) |

Tauri v2 couvre iOS et Android depuis la même app Vite que le desktop — trade-off :
WebView natif (WKWebView iOS / Chromium Android) vs React Native composants natifs.
Pour attendancy (planning lecture seule), **Tauri mobile est suffisant**.
Voir `docs/techs/migration-monorepo.md` §Insight mobile critique.

### Desktop — Tauri

| Couche | Technologie |
|--------|-------------|
| Shell | **Tauri** (Rust + WebView Chromium) |
| Frontend | Next.js exporté en statique **ou** Vite/React standalone |
| Offline data | React Query + IndexedDB persister |
| Auth | Supabase Auth (SDK JS) |

Tauri sert les fichiers localement — l'app est toujours accessible sans réseau.
Le backend Supabase reste distant ; seule la vue planning est mise en cache offline.

---

## Stratégie offline cross-platform

Objectif : **lecture seule du planning sans connexion** — pas d'écriture offline.

| Plateforme | App s'ouvre offline | Données offline | Mécanisme |
|------------|--------------------|-----------------|-|
| Web (Next.js) | Oui (si SW cache le HTML) | React Query + IndexedDB | PWA + service worker |
| Mobile (Expo) | Toujours (natif) | React Query + AsyncStorage/MMKV | `createAsyncStoragePersister` |
| Desktop (Tauri) | Toujours (local) | React Query + IndexedDB | `createAsyncStoragePersister` (IDB) |

Couche partagée : `@tanstack/react-query-persist-client` — même logique de fetch,
persister différent selon plateforme.

Contrainte web : l'utilisateur doit avoir ouvert la page planning **au moins une fois
en ligne** pour que le service worker mette le HTML en cache.

---

## Périmètre partagé entre plateformes

Ces couches sont **portables sans modification** vers Expo et Tauri :

- `src/hooks/data/**` — hooks React Query (fetch + cache)
- `src/services/**/actions/**` — server actions (web uniquement, appelées via API route sur mobile/desktop)
- `src/types/**` — types TypeScript partagés

Ce qui **ne se porte pas** directement :

- Pages RSC / layouts Next.js → remplacer par des composants React classiques sur Expo/Tauri
- `'use server'` actions → exposer via API routes Next.js appelées depuis mobile/desktop
- Service worker → web uniquement
