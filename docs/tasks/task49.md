
consigne : cette tache consiste a mettre a jour le typage ui dans le package ui 


## `src/types/user.ts`(PublicUserInfo)

cible packages\ui\

## `AuthButtonPopover.tsx` (complet)

```tsx
"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { MirrorHover } from "../../design/MirrorHover";
import { UserIcon } from "../../users/UserIcon";
import { AuthMenu } from "./AuthMenu";
import { logout } from "@attendancy/auth";
import { cn } from "../../../lib/utils";
import type { PublicUserInfo } from "@attendancy/types";

export interface AuthButtonPopoverProps {
  user: PublicUserInfo;
  className?: string;
  onSignOut?: () => void | Promise<void>;
  orgInfoUrl?: string;
}

export function AuthButtonPopover({
  user,
  className,
  onSignOut,
  orgInfoUrl,
}: AuthButtonPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      if (onSignOut) {
        await onSignOut();
      } else {
        await logout();
      }
    } finally {
      setIsLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div className={cn("group flex items-center gap-4", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Menu utilisateur"
          >
            <MirrorHover className="flex items-center rounded-full">
              <UserIcon
                name={user.name}
                avatarUrl={user.avatar_url}
                updatedAt={user.updated_at}
                status={user.status}
                className="size-9 border border-border/40 bg-muted ring-0"
              />
            </MirrorHover>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={16}
          alignOffset={10}
          className="p-0 pattern-noise border-0 w-64 shadow-[var(--shadow-card)]"
        >
          <AuthMenu
            user={user}
            onSignOut={handleSignOut}
            isLoggingOut={isLoggingOut}
            onItemClick={() => setOpen(false)}
            orgInfoUrl={orgInfoUrl}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default AuthButtonPopover;
```
packages\ui\src\Header.tsx
## `Header.tsx` (complet)

```tsx
"use client";

import type { ReactNode } from "react";
import type { PublicUserInfo } from "@attendancy/types";
import { ModeToggle } from "./components/layout/Header/ModeToggle";
import { AuthButtonPopover } from "./components/layout/Header/AuthButtonPopover";
import { Link } from "./components/ui/link";
import { cn } from "./lib/utils";

const DEFAULT_BRAND = "Attendancy";

export type HeaderProps = {
  user?: PublicUserInfo;
  onSignOut?: () => void | Promise<void>;
  notifications?: ReactNode;
  brandHref?: string;
  className?: string;
};

export function Header({
  user,
  onSignOut,
  notifications,
  brandHref,
  className,
}: HeaderProps) {
  const org = user?.organization;
  const orgHref = brandHref ?? (org?.slug ? `/${org.slug}` : "/");
  const orgLabel = org?.name ?? DEFAULT_BRAND;

  return (
    <header
      className={cn(
        "z-50 flex h-14 w-full shrink-0 items-center border-b border-border/20 bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex w-full items-center justify-between px-4">
        {/* Brand / Logo */}
        <Link
          href={orgHref}
          className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-fill-faint"
        >
          <span className="grid size-7 place-items-center rounded border border-border/30 bg-muted text-xs font-bold">
            A
          </span>
          <span className="text-sm font-medium text-text-primary">{orgLabel}</span>
        </Link>

        {/* Actions à droite */}
        <div className="flex items-center gap-1">
          <ModeToggle />
          {notifications}
          {user && <AuthButtonPopover user={user} onSignOut={onSignOut} />}
        </div>
      </div>
    </header>
  );
}

export default Header;
```

Dans les deux fichiers, j'ai retiré le repli `user_metadata` (code mort depuis l'aplatissement de `UserInfo`, et source des `any`) ainsi que les `| null`.

## Deux points à connaître

- **Un type n'efface rien à l'exécution.** `PublicUserInfo` empêche le code client de lire `invitationToken`, mais si tu passes un `UserInfo` complet depuis un Server Component, TS accepte (le type est un sous-ensemble) et les champs critiques sont quand même sérialisés vers le navigateur. Pour les retirer vraiment, il faut une fonction qui supprime les clés de `SENSITIVE_USER_KEYS` et `SENSITIVE_ORGANIZATION_KEYS`. Elle serait générique, valable pour toutes les UI, et irait dans `modules/user/utils.ts`. Je ne l'ai pas écrite, puisque tu as demandé le typage. Dis-moi si tu la veux.
- **C'est une liste de refus.** Un nouveau champ ajouté plus tard aux schémas est public par défaut, tant qu'on ne l'ajoute pas à une des deux listes. Si tu préfères que tout soit privé par défaut, on inverse en liste d'autorisation, mais il faut alors nommer les champs publics.

## À vérifier

- **`AuthMenu`** : je ne l'ai pas vu. S'il lit `organization.logo`, c'est déjà dans le type. S'il lit `permissions` ou `function`, TS le signalera, et il faut alors décider si la donnée doit vraiment arriver au client.
- **`HeaderUser`** : l'ancien export disparaît. Cherche ses usages avec `git grep -nw "HeaderUser"` et remplace-les par `PublicUserInfo`.
- **`@attendancy/types`** : il doit exporter `PublicUserInfo`. Vérifie le barrel.

generateUserInfo est la couche d’exécution, et PublicUserInfo est le type du résultat. Le rôle est clair, je ne fais pas de fonction en plus.

Un point reste à surveiller, car TS ne le détectera pas. generateUserInfo ne filtre qu’au premier niveau. Si tu demandes la clé organization, l’objet entier part, permissions et les ids de profils compris. L’objet est quand même assignable à PublicOrganization, car TS accepte les propriétés en trop sur une valeur non littérale. La compilation passe donc sans alerte.

Le paramètre overrides déjà prévu règle ça au site d’appel :

ts
const { name, slug, logo } = user.organization ?? {}

const publicUser = generateUserInfo(
  user,
  ['id', 'name', 'email', 'avatar_url', 'updated_at', 'status', 'role', 'organization'],
  { organization: { name, slug, logo } },
)

Si le organization d’origine ne contient pas ces trois champs, overrides passe en { organization: {} } au lieu de undefined. Le résultat reste correct et est vaider

Les tableaux de clés passés à generateUserInfo n’ont pas besoin d’être déclarés une fois par UI : le typage du résultat contraint déjà ce que le composant peut lire. Tu peux donc écrire la liste directement à l’appel, sans constante partagée.

Il reste une chose à faire dans modules/user/utils.ts : passer keys: K[] en keys: readonly K[] si tu veux pouvoir réutiliser une liste as const à plusieurs endroits. Sinon, ce n’est pas nécessaire