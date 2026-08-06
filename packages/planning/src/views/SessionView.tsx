'use client'

import { useActiveSession } from '../hooks/useActiveSession'

export function SessionView() {
  const { data: session, isLoading } = useActiveSession()

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <span className="text-sm text-muted-foreground">Chargement…</span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">Aucune session en cours</p>
      </div>
    )
  }

  const start = session.startedAt.slice(11, 16)
  const elapsed = Math.floor(
    (Date.now() - new Date(session.startedAt).getTime()) / 60000,
  )

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            Session en cours
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{elapsed} min</span>
      </div>

      <div>
        <p className="font-semibold text-foreground">{session.courseName}</p>
        <p className="text-sm text-muted-foreground">{session.className}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>⏱ Depuis {start}</span>
        {session.roomName && <span>📍 {session.roomName}</span>}
        {session.teacherName && <span>👤 {session.teacherName}</span>}
      </div>
    </div>
  )
}
