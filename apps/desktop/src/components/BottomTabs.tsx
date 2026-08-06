import { useRouter, useRouterState, Link } from '@tanstack/react-router'
import { useActiveSession } from '@attendancy/planning'

type Tab = {
  to: string
  label: string
  icon: (active: boolean) => React.ReactNode
  badge?: boolean
}

const CalendarIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
  </svg>
)

const SessionIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

export function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: activeSession } = useActiveSession()

  const tabs: Tab[] = [
    {
      to: '/planning',
      label: 'Planning',
      icon: CalendarIcon,
    },
    {
      to: '/session',
      label: 'Session',
      icon: SessionIcon,
      badge: !!activeSession,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-border/20 bg-background/90 backdrop-blur-sm">
      {tabs.map((tab) => {
        const active = pathname === tab.to || pathname.startsWith(tab.to + '/')
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors"
          >
            <span className={active ? 'text-primary' : 'text-muted-foreground'}>
              {tab.icon(active)}
            </span>

            {tab.badge && (
              <span className="absolute right-[calc(50%-18px)] top-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}

            <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              {tab.label}
            </span>

            {active && (
              <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
