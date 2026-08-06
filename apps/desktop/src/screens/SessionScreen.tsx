import { SessionView } from '@attendancy/planning'

export function SessionScreen() {
  return (
    <div>
      <div className="border-b border-border/20 px-4 py-3">
        <h2 className="text-sm font-semibold">Session en cours</h2>
      </div>
      <div className="p-4">
        <SessionView />
      </div>
    </div>
  )
}
