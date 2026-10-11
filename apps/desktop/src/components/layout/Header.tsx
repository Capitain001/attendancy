import { Header as SharedHeader } from "@attendancy/ui";
import { NotificationsPopover } from "@/components/layout/sidebar/ui/NotificationsPopover";
import type { UserInfo } from "@desktop/types/user";
import { orgPath } from "@/config";

interface HeaderProps {
  user?: UserInfo;
}

/**
 * Composant Header réel pour l'application Desktop.
 * Utilise le Header partagé de @attendancy/ui avec gestion native du profil, du thème et de la déconnexion.
 */
export function Header({ user }: HeaderProps) {
  return (
    <SharedHeader
      user={user}
      brandHref={user ? orgPath(user) : undefined}
      notifications={user ? <NotificationsPopover /> : undefined}
    />
  );
}

export default Header;

