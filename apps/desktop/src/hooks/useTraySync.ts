import { useEffect } from 'react'
import { useActiveSession } from '@attendancy/planning'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function useTraySync() {
  const { data: session } = useActiveSession()

  useEffect(() => {
    if (!isTauri) return
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('set_tray_session', {
        active: !!session,
        course: session?.courseName ?? null,
      }).catch(() => {})
    })
  }, [session])
}
