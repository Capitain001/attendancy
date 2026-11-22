// src/services/permission/server.ts
// Surface serveur du service, pour les autres modules : lecture des permissions effectives
// uniquement. Les mutations passent par les actions (auth + validation), jamais par ici.
import 'server-only'

export { getEffectivePermissionNames } from './database'