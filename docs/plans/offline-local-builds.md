# Plan — Versions locales (offline lecture) → Offline sync complet

> Statut : proposition · Date : 2026-09-28
> Références : `docs/techs/stack.md` (§ Stratégie offline cross-platform),
> `docs/techs/migration-monorepo.md`, `CLAUDE.md` (invariants packages).

## Objectif

Livrer des versions **installables locales** de l'app — `.exe` (Windows desktop)
et `.apk` (Android via Tauri v2) — fonctionnant en **lecture seule sans
connexion** (planning en cache), puis préparer le terrain pour le **offline sync
complet** (écritures en file d'attente + réconciliation).

Principe directeur : **une seule codebase React** (`apps/desktop` + packages
`@attendancy/planning` / `@attendancy/types`), deux cibles de build Tauri v2
(desktop et Android). Aucun fork de code entre plateformes.

---

## État existant (déjà en place — à ne pas refaire)

| Élément | Localisation | État |
|---|---|---|
| Shell Tauri v2 desktop (Vite + React 19) | `apps/desktop` + `src-tauri/` | ✅ |
| React Query + persistance IndexedDB | `apps/desktop/src/App.tsx:27` (`PersistQueryClientProvider` + `idbPersister`) | ✅ |
| Cache offline 7 jours | `packages/planning/src/hooks/usePlanning.ts:21` (`gcTime`) | ✅ |
| Auth Supabase (session persistée) | `apps/desktop/src/hooks/useAuth.ts` | ✅ |
| Realtime invalidation du planning | `apps/desktop/src/App.tsx:58` (canal `Schedule`) | ✅ |
| Client API Bearer | `packages/planning/src/lib/api-client.ts` (`apiFetch` + `setAuthToken`) | ✅ |
| Persister cross-platform | `packages/planning/src/lib/persister.ts` | ✅ |

Fondation de la stack.md déjà actée : lecture seule offline, React Query
persister, Tauri mobile suffisant pour du planning lecture seule.

---

## Phase 0 — Socle offline UX (partagé desktop + mobile)

**But :** l'utilisateur comprend toujours ce qu'il voit offline.

1. `packages/planning/src/hooks/useOnline.ts` — hook `navigator.onLine` +
   écouteurs `online`/`offline` (aucune dépendance Tauri → portable).
2. Bannière `OfflineBanner` dans `apps/desktop/src/components/` :
   - affichée si `!online` **ou** si la dernière requête planning a échoué ;
   - texte : « Mode hors ligne — lecture seule · dernière synchro : <date> ».
3. Date de dernière synchro : stockée dans le cache React Query (dérivée de
   `dataUpdatedAt` de `usePlanning`) — pas de nouvelle persistance nécessaire.
4. Comportement d'échec : React Query sert le cache persisté en cas d'erreur
   réseau (comportement natif `persistQueryClient` — vérifier `retry`/`gcTime`
   couvrent la fenêtre offline voulue).

**Validation :** couper le réseau → l'app affiche le planning en cache + la
bannière, sans crash ni spinner infini.

---

## Phase 1 — Desktop `.exe` (Windows)

**But :** installeur Windows signé (ou non, selon distribution) reproductible
depuis le monorepo.

1. **Bundle target** — `apps/desktop/src-tauri/tauri.conf.json` :
   - `bundle.targets` : `"nsis"` (installeur léger, standard Tauri Windows) ;
   - `bundle.windows` : config NSIS (langue, `installMode: perUser`).
2. **Env de production** — `apps/desktop/.env` (déjà présent) doit contenir en
   build :
   - `VITE_API_URL` = URL Vercel de l'API web ;
   - clés publiques Supabase (URL + anon key — publique, pas de secret).
3. **Build** :
   ```bash
   cd apps/desktop
   bun run tauri build          # → src-tauri/target/release/bundle/nsis/*.exe
   ```
4. **Script racine** (optionnel) : `bun run build:desktop` dans le `package.json`
   racine qui chaîne turbo → tauri build.
5. **Test offline** : installer, se connecter une fois en ligne, naviguer sur le
   planning, couper le réseau, relancer l'app → planning visible en cache.

**Livrable :** `.exe` installable + doc de build dans le README de `apps/desktop`.

---

## Phase 2 — Android `.apk` (Tauri v2 mobile)

**But :** APK debug installable manuellement, même code React.

### Prérequis machine (one-shot)

- Rust : `rustup target add aarch64-linux-android armv7-linux-androideabi`
- Android SDK + NDK (via Android Studio) ; `JAVA_HOME` sur JDK 17 ;
  variables `ANDROID_HOME`, `NDK_HOME`.
- `bun run tauri doctor` pour valider la chaîne d'outils.

### Étapes

1. **Init mobile** :
   ```bash
   cd apps/desktop
   bun run tauri android init    # → génère src-tauri/gen/android (commit ?)
   ```
   Décision : commit `gen/android` (recommandé — permet de customiser le
   manifest/gradle de façon reproductible).
2. **Identité app** : `identifier` actuel `io.attendancy.app` — vérifier qu'il
   est valide comme `applicationId` Android (pas de tiret, segments valides).
3. **Manifest Android** :
   - `INTERNET` (ajouté par défaut par Tauri) ;
   - pas de cleartext (HTTPS Supabase/Vercel uniquement).
4. **Build debug** :
   ```bash
   cd apps/desktop
   bun run tauri android build --apk          # release unsigned
   # ou pour itérer :
   bun run tauri android dev                  # hot reload sur device/émulateur
   ```
   Sortie : `src-tauri/gen/android/app/build/outputs/apk/…`
5. **WebView Android** : planning Tailwind v4 + base-ui — vérifier le rendu sur
   WebView Chromium (System WebView des devices de test, min SDK raisonnable).
6. **Test offline** : installer l'APK, se connecter une fois, couper le
   réseau (mode avion), relancer → planning en cache.

**Livrable :** `.apk` debug + `tauri doctor` propre + doc de setup Android.

### Points de vigilance

- `import.meta.env.VITE_API_URL` doit être défini au build Android aussi
  (build-time, pas runtime).
- Realtime Supabase sur mobile : WebSocket WebView — fonctionne, mais
  silencieusement absent offline (déjà géré : invalidation seulement).
- Taille APK : Tauri v2 ~5–10 MB, acceptable.

---

## Phase 3 — Lecture offline robuste

**But :** garantir que le cache est *utile*, pas juste *présent*.

1. **Préchargement** : à la connexion (desktop/mobile), déclencher
   `usePlanning` sur la fenêtre courante + semaine suivante (prefetch
   `queryClient.prefetchQuery`), pour que le cache existe avant la première
   navigation offline.
2. **Fenêtre offline** : décider la règle produit —
   - cache 7 jours (actuel) : au-delà, afficher « données trop anciennes »
     plutôt que des données silencieusement périmées ;
   - implémentation : comparer `dataUpdatedAt` dans `OfflineBanner`.
3. **Session offline** : vérifier que `useAuth` persiste la session Supabase
   (localStorage/IndexedDB via `persistSession: true`) et que l'app ne bloque
   pas sur un refresh token expiré offline — en lecture seule, utiliser la
   session locale même si le refresh échoue.
4. **Multi-fenêtres temporelles** : si le planning peut être consulté au-delà
   de 2 semaines en arrière, prefetcher ou accepter l'absence offline.

**Validation :** avion + redémarrage app + navigation multi-semaines →
comportement défini et documenté.

---

## Phase 4 — Offline sync complet (écritures)

> Hors périmètre de la V1 locale. Conçu ici pour que les phases 0–3 ne
> ferment aucune porte.

### Architecture cible

```
Écran (packages/planning) → hooks data → mutation locale (optimiste)
                              ↓
                    MutationQueue (IndexedDB, persistée)
                              ↓ (quand online)
                    POST /api/<svc> avec Idempotency-Key
                              ↓
                    Serveur (Next.js API, orgId token) → Prisma → Postgres
```

### Composants

1. **File d'attente persistée** (nouveau package `@attendancy/sync` ou
   extension de `@attendancy/planning`) :
   - chaque mutation = `{ id: uuid (idempotency key), op, payload, createdAt,
     status }` en IndexedDB ;
   - drain automatique à l'événement `online` + au démarrage ;
   - UI : badge « N modifications en attente » + rollback visuel si rejet.

2. **Idempotence serveur** :
   - chaque endpoint d'écriture accepte un header `Idempotency-Key` ;
   - table `IdempotencyLog (key, orgId, endpoint, responseHash, createdAt)`
     — replay → renvoyer la réponse d'origine, pas re-exécuter ;
   - invariants respectés : `orgId` du token uniquement, Prisma dans
     `database/`, actions via API routes (jamais de server action appelée
     depuis mobile/desktop).

3. **Résolution de conflits** :
   - par défaut **last-write-wins** sur `updatedAt` (planning = données à faible
     contention, un prof modifie sa classe) ;
   - exceptions à définir par modèle : si un modèle est éditable par plusieurs
     rôles simultanément (ex. remplacements), passer en détection de conflit
     (comparer `updatedAt` serveur vs version lue au moment de la file) et
     demander à l'utilisateur (UI de conflit) ;
   - soft delete (`removedAt`) : la suppression gagne toujours sur une écriture
     concurrente plus ancienne.

4. **Types & schéma** :
   - `packages/types` : ajouter les DTO de sync (`MutationOp`, `SyncEnvelope`)
     — pas de dépendance Prisma (invariant) ;
   - Prisma : nouveau schema `prisma/schemas/sync.prisma` (table
     `IdempotencyLog`) — un domaine = un service `sync`.

5. **Sécurité** : la file locale ne contient aucun token ; l'envoi utilise la
   session courante. Si l'utilisateur se déconnecte avec une file non vide →
   avertissement explicite (perte des modifications locales).

### Découpage en itérations (quand ce sera lancé)

| Itération | Contenu |
|---|---|
| 4a | Queue + drain + idempotency log (1 seul type d'écriture, ex. présence) |
| 4b | Généralisation aux autres services d'écriture |
| 4c | UI de conflit + tests d'intégration (2 devices, réseau coupé) |

---

## Ordre de travail recommandé

1. Phase 0 (½ jour) — hook + bannière.
2. Phase 1 (½ jour) — build `.exe`, test offline.
3. Phase 2 (1–2 jours) — setup Android SDK, init, build APK, test offline.
4. Phase 3 (1 jour) — prefetch, règle d'expiration, session offline.
5. Phase 4 — non planifiée, à chiffrer séparément.

## Questions ouvertes

- Distribution `.exe` : auto-update Tauri (`updater` plugin) à prévoir dès la
  phase 1 ou plus tard ?
- Fenêtre offline produit : 7 jours suffit-elle, ou illimité en lecture ?
- `gen/android` commité dans git (recommandé) ou régénéré ?
