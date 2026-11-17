# `@attendancy/ui`

## Role

Bibliotheque de composants React, de providers, de styles et de primitives
partagees entre le web Next.js et les clients Vite/Tauri. Elle ne porte pas la
navigation applicative ni les appels de donnees.

## Entrees publiques

- `src/index.ts` expose les composants partages tels que `Button`, `Card`,
  `Header`, `MainLayout`, `AppProvider`, les elements d'authentification,
  navigation, theme et notification, ainsi que les utilitaires UI.
- `AppProvider` installe les providers de theme, les definitions visuelles
  partagees et le `Toaster` Sonner.
- `Header` accepte des props pour l'utilisateur, le callback de deconnexion,
  les notifications et l'etat hors ligne; il ne possede pas la session.
- Les exports `@attendancy/ui/styles.css` et `@attendancy/ui/styles/*`
  fournissent les styles globaux et themes.
- L'export `@attendancy/ui/*` cible les composants sous `src/components/`.

## Integration et dependances

React est un peerDependency. Les composants peuvent etre utilises dans React
18/19; les composants importes par Next.js marquent explicitement la frontiere
client (`"use client"`). Le host doit installer les styles necessaires et
fournir ses callbacks de navigation/authentification.

Le package depend notamment de `@attendancy/types`, Tailwind-compatible styles,
Radix UI, `next-themes`, Sonner et des utilitaires de composants. Les composants
ne doivent pas importer de logique serveur ni resoudre eux-memes les donnees du
domaine.

## Verification

```powershell
bun --filter @attendancy/ui check-types
```
