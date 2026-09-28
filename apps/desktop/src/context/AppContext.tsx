import { createContext, useContext } from 'react'

type AppCtx = { classId: string | null; teacherId: string | null; role: string | null }

const Ctx = createContext<AppCtx | null>(null)

export const AppContextProvider = Ctx.Provider

export function useAppContext(): AppCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppContext must be used inside AppContextProvider')
  return ctx
}
