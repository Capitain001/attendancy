import { ModeToggle } from "@/components/layout/Header/ModeToggle";
import { AuthButtonPopover } from "@/components/auth/ui/AuthButtonPopover";
import { NotificationsPopover } from "@/components/layout/sidebar/ui/NotificationsPopover";
import type { UserInfo } from "@desktop/types/user";
import { orgPath } from "@/config";
import Link from "../ui/Link";

interface HeaderProps {
  user?: UserInfo;
}

/**
 * Composant Header réel pour l'application Desktop.
 * Identique au Header web, utilisant le composant UI Link agnostique.
 */
export function Header({ user }: HeaderProps) {
  const orgHref = orgPath(user);
  const orgLabel = user?.organization?.name ?? "Attendancy";

  return (
    <header className="z-50 flex h-14 w-full items-center border-b border-border/20 bg-background/80 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between px-4">
        <Link
          href={orgHref}
          className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-fill-faint"
        >
          <span className="grid size-7 place-items-center rounded border border-border/30 bg-muted text-xs font-bold">
            A
          </span>
          <span className="text-sm font-medium text-text-primary">{orgLabel}</span>
        </Link>
        <div className="flex items-center gap-1">
          <ModeToggle />
          {user && <NotificationsPopover />}
          {user && <AuthButtonPopover user={user} />}
        </div>
      </div>
    </header>
  );
}

export default Header;
