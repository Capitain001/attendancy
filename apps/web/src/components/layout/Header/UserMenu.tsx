import { logoutAction, logoutActionForm } from '@/modules/auth'
import type { UserInfo } from '@/types/user'
import Link from 'next/link'
import { LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

function initials(name?: string, email?: string): string {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

export function UserMenu({ user }: { user: UserInfo }) {
  return (
    <div className="relative inline-block">
      <div className="flex size-9 items-center justify-center rounded-full border border-border/40 bg-muted text-xs font-medium text-text-primary">
        {initials(user.name, user.email)}
      </div>

      <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border border-border/30 bg-card shadow-[var(--shadow-card)]">
        <div className="border-b border-border/20 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-text-primary">{user.name ?? user.email}</p>
          {user.name && (
            <p className="truncate text-xs text-text-subtle">{user.email}</p>
          )}
          {user.role && (
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-text-subtle">
              {user.role}
            </p>
          )}
        </div>

        <div className="p-1">
          <Link
            href="/settings"
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary',
              'hover:bg-fill-faint hover:text-text-primary transition-colors'
            )}
          >
            <Settings className="size-3.5" />
            Paramètres
          </Link>

          <form action={logoutActionForm}>
            <button
              type="submit"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive',
                'hover:bg-destructive/10 transition-colors'
              )}
            >
              <LogOut className="size-3.5" />
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
