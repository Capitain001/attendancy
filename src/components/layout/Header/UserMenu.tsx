// 'use client'
// import { useState, useRef, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/services/auth'
import type { UserInfo } from '@/services/user/types'

function initials(name?: string, email?: string): string {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

export function UserMenu({ user }: { user: UserInfo }) {
  // const [open, setOpen] = useState(false)
  // const ref             = useRef<HTMLDivElement>(null)
  // const router          = useRouter()

  // useEffect(() => {
  //   function close(e: MouseEvent) {
  //     if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
  //   }
  //   document.addEventListener('mousedown', close)
  //   return () => document.removeEventListener('mousedown', close)
  // }, [])

  async function handleLogout() {
    await logoutAction()
    window.location.href = '/login'
  }

  return (
    <div
    //  ref={ref} 
    className="relative">
      <button
        type="button"
        // onClick={() => setOpen(o => !o)}
        className="flex size-9 items-center justify-center rounded-full border border-border/40 bg-muted text-xs font-medium text-text-primary transition-colors hover:bg-fill-faint"
        aria-label="Menu utilisateur"
      >
        {initials(user.name, user.email)}
      </button>

      {/* {open && (
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
            <button
              type="button"
              onClick={() => { setOpen(false); router.push('/settings') }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary',
                'hover:bg-fill-faint hover:text-text-primary transition-colors'
              )}
            >
              <Settings className="size-3.5" />
              Paramètres
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive',
                'hover:bg-destructive/10 transition-colors'
              )}
            >
              <LogOut className="size-3.5" />
              Se déconnecter
            </button>
          </div>
        </div>
      )} */}
    </div>
  )
}
