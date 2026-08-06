import { createContext, useContext } from 'react'

type AppCtx = { classId: string }

const Ctx = createContext<AppCtx | null>(null)

export const AppContextProvider = Ctx.Provider

export function useAppContext(): AppCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppContext must be used inside AppContextProvider')
  return ctx
}
