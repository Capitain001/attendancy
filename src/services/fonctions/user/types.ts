import type { UserFunction } from '@/generated/prisma/client'
export type { UserFunction }

export type UserFunctionAssignment = UserFunction & {
  function?: { id: string; name: string; description?: string | null; icon?: string | null }
  user?: { id: string; firstName: string | null; lastName: string | null; email: string }
}
