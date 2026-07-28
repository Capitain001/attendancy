import Link from 'next/link'
import { ModeToggle } from './ModeToggle'
import { UserMenu } from './UserMenu'
import type { UserInfo } from '@/services/user/types'

interface HeaderProps {
  user?: UserInfo
}

export default function Header({ user }: HeaderProps) {
  const orgHref  = user?.organization?.slug ? `/${user.organization.slug}` : '/'
  const orgLabel = user?.organization?.name ?? 'Attendancy'

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
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-fill-faint hover:text-text-primary"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
