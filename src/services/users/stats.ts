import { getUserRoleStats as _getUserRoleStats } from './database'

export type UserRoleStats = Awaited<ReturnType<typeof _getUserRoleStats>>

export { _getUserRoleStats as getUserRoleStats }
