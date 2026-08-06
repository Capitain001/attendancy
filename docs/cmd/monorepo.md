# Commandes monorepo

Toutes les commandes s'exécutent depuis la **racine** `attendancy/` sauf mention contraire.

---

## Développement

### Tout lancer (web + desktop Tauri)

```bash
bun dev
```

Lance en parallèle :
- `apps/web` — Next.js sur `:3000` (API + frontend web)
- `apps/desktop` — Vite `:1420` + shell Rust Tauri

### Web seul

```bash
bun run dev:web
```

### Desktop Vite seul (sans Tauri/Rust)

```bash
bun run dev:desktop
```

### Desktop Tauri seul (depuis la racine)

```bash
bun --filter @attendancy/desktop run tauri:dev
```

Ou depuis `apps/desktop/` :

```bash
bun tauri dev
```

---

## Build

### Build tous les packages

```bash
bun run build
```

### Build un package spécifique

```bash
bun run build --filter=@attendancy/web
bun run build --filter=@attendancy/desktop
bun run build --filter=@attendancy/planning
```

---

## Types & Lint

```bash
bun run check-types   # tsc --noEmit sur tous les packages
bun run lint          # lint turbo (tous les packages)
bun run format        # prettier sur *.ts, *.tsx, *.md
```

---

## Packages workspace

| Package | Nom npm | Répertoire |
|---------|---------|-----------|
| Web (Next.js) | `@attendancy/web` | `apps/web/` |
| Desktop (Tauri) | `@attendancy/desktop` | `apps/desktop/` |
| Planning (views + hooks) | `@attendancy/planning` | `packages/planning/` |
| Types partagés | `@attendancy/types` | `packages/types/` |
| UI partagé | `@attendancy/ui` | `packages/ui/` |

### Installer une dépendance dans un package

```bash
bun add <pkg> --filter @attendancy/desktop
bun add <pkg> --filter @attendancy/web
bun add -d <pkg> --filter @attendancy/planning
```

---

## Tauri

| Action | Commande (depuis racine) |
|--------|--------------------------|
| Dev (Vite + Rust) | `bun --filter @attendancy/desktop run tauri:dev` |
| Build release | `bun --filter @attendancy/desktop tauri build` |
| Ajouter plugin Tauri | `bun --filter @attendancy/desktop tauri add <plugin>` |
| Init Android | `bun --filter @attendancy/desktop tauri android init` |
| Dev Android | `bun --filter @attendancy/desktop tauri android dev` |
| Init iOS | `bun --filter @attendancy/desktop tauri ios init` |
| Dev iOS | `bun --filter @attendancy/desktop tauri ios dev` |

---

## Turbo

```bash
# Lancer une tâche sur un package précis
bunx turbo <task> --filter=@attendancy/<package>

# Voir le cache turbo
bunx turbo run build --dry-run

# Vider le cache local
bun run clean
```
