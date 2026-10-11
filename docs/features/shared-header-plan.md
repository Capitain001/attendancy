# Plan de migration : Header partagé (@attendancy/ui)

> **Objectif** : Remplacer le `Header.tsx` minimaliste de `packages/ui` par le véritable Header Attendancy (identique à `apps/desktop` et `apps/web`) afin d'offrir une expérience utilisateur 100 % cohérente sur toutes les applications (`web`, `desktop`, `teacher`), tout en levant les blocages d'architecture pas à pas.

---

## Tableau récapitulatif (Lecture rapide)

| Composant | Prêt immédiatement | Blocage identifié | Solution retenue | Emplacement cible dans packages/ui |
|---|:---:|---|---|---|
| **Structure & Layout** | ✓ | Aucun | Déplacer le conteneur `h-14` avec fond flouté | `src/Header.tsx` |
| **Brand (Logo `[ A ]` + Org)** | ✓ | Dépendance à `orgPath` web | Utiliser le `Link` agnostique de UI + calcul simple de route | `src/components/layout/Header/HeaderBrand.tsx` |
| **ModeToggle (Thème)** | ✓ | Aucun (`next-themes` et `lucide-react` déjà dans UI) | Déplacement direct du composant | `src/components/layout/Header/ModeToggle.tsx` |
| **AuthButtonPopover (Profil / Menu)** | x | Dépend de `LogOutForm` (Server Action Next.js) et `next/link` | Remplacer par `logout()` de `@attendancy/auth` + `Link` agnostique | `src/components/layout/Header/AuthButtonPopover.tsx` |
| **NotificationsPopover (Cloche)** | x | Dépend de Prisma (`NotificationType`) et du hook web | Phase 1 : slot optionnel / injectable<br>Phase 2 : client HTTP/RPC partagé | `src/components/layout/Header/NotificationsPopover.tsx` |

---

## 1. État des lieux et anatomie du Header cible

Le Header complet (tel que défini dans `apps/desktop/src/components/layout/Header.tsx` et `apps/web/src/components/layout/Header/Header.tsx`) est composé de 4 briques fonctionnelles :

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [ A ] Attendancy / OrgName  │  (Centre)  │ [ModeToggle] [Notifications] [User]   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **Brand & Organisation** (`[ A ] {orgLabel}`) :
   - Logo / Initiale de l'organisation dans un carré stylisé.
   - Lien vers le tableau de bord de l'organisation (`/${slug}`).
2. **Sélecteur de thème (`ModeToggle`)** :
   - Bascule claire / sombre avec icônes Sun/Moon.
3. **Cloche de notifications (`NotificationsPopover`)** :
   - Badge du nombre de notifications non lues.
   - Popover déroulant avec pile de notifications (CardStack).
4. **Bouton & Menu utilisateur (`AuthButtonPopover` / `AuthMenu`)** :
   - Avatar / Initiales de l'utilisateur avec statut.
   - Popover déroulant : résumé utilisateur (nom, email), liens Profil / Paramètres, et bouton **Déconnexion**.

---

## 2. Analyse détaillée : ce qui peut être partagé immédiatement vs les blocages

| Composant du Header | Éléments partagés / Prêts | Blocages identifiés | Solution ciblée |
|---|---|---|---|
| **Structure & Conteneur** | HTML, CSS, Tailwind, `h-14`, flou backdrop | Aucun | Migration immédiate dans `packages/ui` |
| **Brand (`Link` + Org)** | `Link` agnostique déjà dans `packages/ui` (`@attendancy/ui/link`) | Calcul de l'URL dépendant de `orgPath` | Créer un helper de route simple et agnostique (`user?.organization?.slug ? "/${slug}" : "/"`) |
| **`ModeToggle`** | `next-themes` et `lucide-react` déjà installés dans `packages/ui` | Aucun | Déplacer le composant dans `packages/ui/src/components/layout/Header/ModeToggle.tsx` |
| **`AuthButtonPopover` & `AuthMenu`** | `@radix-ui/react-popover` et `@radix-ui/react-avatar` déjà dans `packages/ui` | 1. Import de `LogOutForm` (Server Action Next.js)<br>2. Import de `next/link`<br>3. Typage `UserInfo` | 1. Utiliser `logout()` de `@attendancy/auth`<br>2. Utiliser `Link` agnostique de `@attendancy/ui`<br>3. Typage utilisateur générique partagé |
| **`NotificationsPopover`** | Primitives UI Popover / Lucide Bell | 1. Dépendance à Prisma client (`NotificationType`)<br>2. Dépendance au hook web `useNotifications` | **Étape transitoire** : rendre la cloche optionnelle / injectable via prop, puis migrer le service notifications vers l'API HTTP/RPC |

---

## 3. Plan d'exécution pas à pas

### Étape 1 : Les briques immédiatement partageables (Zéro blocage)
- [ ] **Déplacer `ModeToggle` dans `packages/ui`** :
  - Créer `packages/ui/src/components/layout/Header/ModeToggle.tsx`.
  - Utilise `useTheme` de `next-themes` et `Sun`/`Moon` de `lucide-react`.
- [ ] **Créer `HeaderBrand` dans `packages/ui`** :
  - Gère l'affichage du logo carré `[ A ]` et du nom de l'organisation.
  - Utilise le composant agnostique `Link` de `packages/ui`.

### Étape 2 : Résoudre le blocage de l'authentification (`AuthButtonPopover`)
- [ ] **Déconnecter `AuthMenu` de Next.js Server Actions** :
  - Remplacer `<LogOutForm />` par un bouton appelant directement l'action universelle `logout()` de `@attendancy/auth`.
- [ ] **Remplacer `next/link` par le `Link` agnostique** :
  - Utiliser le `Link` de `@attendancy/ui` pour les liens du menu (Profil, Settings, etc.).
- [ ] **Standardiser l'avatar dans `packages/ui`** :
  - Créer un composant d'Avatar léger (`UserAvatar` ou `UserIcon`) basé sur `@radix-ui/react-avatar` (déjà présent dans `packages/ui`).
- [ ] **Assembler `AuthButtonPopover` dans `packages/ui`** :
  - Déplacer `AuthButtonPopover` dans `packages/ui/src/components/layout/Header/AuthButtonPopover.tsx`.

### Étape 3 : Gérer la cloche de notifications (`NotificationsPopover`)
- [ ] **Approche en deux temps** :
  - **Court terme (Déblocage immédiat)** :
    Le Header dans `packages/ui` accepte un slot optionnel `notificationsSlot?: ReactNode` (ou `renderNotifications?: () => ReactNode`).
    - `apps/web` et `apps/desktop` peuvent lui injecter le `NotificationsPopover` actuel.
    - `apps/teacher` fonctionne directement sans être bloqué par Prisma.
  - **Moyen terme** :
    Remplacer les requêtes Prisma de `useNotifications` par un appel d'API HTTP partagé (`apiFetch` / RPC) et déplacer `NotificationsPopover` dans `@attendancy/ui` pour qu'il soit autonome partout.

### Étape 4 : Assembler le nouveau `Header.tsx` de `packages/ui`
- [ ] Écrire le nouveau `packages/ui/src/Header.tsx` unifié :
  ```tsx
  export function Header({
    user,
    notifications,
    onSignOut,
  }: HeaderProps) {
    // Rend Brand + ModeToggle + Notifications (si fournies) + AuthButtonPopover
  }
  ```
- [ ] Mettre à jour les exports dans `packages/ui/src/index.ts`.

### Étape 5 : Brancher et valider sur toutes les applications
- [ ] **`packages/app/src/RootLayout.tsx`** :
  - Utilise automatiquement le nouveau Header complet (avec profil utilisateur et déconnexion `@attendancy/auth`).
- [ ] **`apps/teacher`** :
  - Tester que le Header complet s'affiche et que la déconnexion fonctionne via `@attendancy/auth`.
- [ ] **`apps/desktop`** :
  - Remplacer l'import du header local par le Header partagé de `@attendancy/ui`.
- [ ] **`apps/web`** :
  - Aligner l'utilisation sur `@attendancy/ui`.

---

## 4. Bénéfices finaux

1. **Source de vérité unique** : Un seul composant Header pour tout le monorepo (`web`, `desktop`, `teacher`).
2. **Déconnexion unifiée** : `@attendancy/auth` gère la clôture de session Supabase + Cache TanStack de manière identique partout.
3. **Respect strict des règles d'architecture** : Pas de Prisma ni de Next.js Server Actions dans `packages/ui`.
