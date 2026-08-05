// src/services/users/cache/invalidation.ts
/**
 * Helpers pour l'invalidation intelligente du cache utilisateur
 * 
 * Ce module fournit des fonctions pratiques pour invalider le cache
 * dans différents scénarios courants de l'application.
 * 
 * @example
 * ```typescript
 * import { CacheInvalidation } from '@/services/users/cache-invalidation'
 * 
 * // Après mise à jour profil
 * CacheInvalidation.onUserUpdate(userId)
 * 
 * // Après changement d'organisation
 * CacheInvalidation.onOrganizationChange('acme-corp')
 * ```
 */

import { 
  removeUser, 
  removeUsersByOrg, 
  removeUsersByOrgAccess,
  clearCache,
  getCacheStats,
  getCacheStatsByOrg 
} from '../lru-cache'

export class CacheInvalidation {
  /**
   * Invalide le cache après mise à jour d'un utilisateur
   * 
   * À utiliser après:
   * - Mise à jour du profil
   * - Changement de rôle
   * - Modification des permissions
   * 
   * @param userId - ID de l'utilisateur
   * @returns true si l'utilisateur était en cache
   * 
   * @example
   * ```typescript
   * // Dans ton API route PATCH /api/users/:id
   * export async function PATCH(req: Request, { params }: { params: { id: string } }) {
   *   const userId = params.id
   *   const updates = await req.json()
   *   
   *   // Mise à jour en base
   *   await updateUser(userId, updates)
   *   
   *   // Invalider le cache
   *   CacheInvalidation.onUserUpdate(userId)
   *   
   *   return Response.json({ success: true })
   * }
   * ```
   */
  static onUserUpdate(userId: string): boolean {
    const deleted = removeUser(userId)
    
    if (deleted) {
      console.log(`[Cache] ✅ Utilisateur ${userId} invalidé`)
    }
    
    return deleted
  }

  /**
   * Invalide le cache après changement d'une organisation
   * 
   * À utiliser après:
   * - Mise à jour des infos d'organisation
   * - Changement de slug
   * - Modification des permissions globales
   * 
   * @param orgSlug - Slug de l'organisation
   * @returns Nombre d'utilisateurs invalidés
   * 
   * @example
   * ```typescript
   * // Dans ton API route PUT /api/organizations/:slug
   * export async function PUT(req: Request, { params }: { params: { slug: string } }) {
   *   const orgSlug = params.slug
   *   const updates = await req.json()
   *   
   *   // Mise à jour en base
   *   await updateOrganization(orgSlug, updates)
   *   
   *   // Invalider tous les utilisateurs de cette org
   *   const count = CacheInvalidation.onOrganizationChange(orgSlug)
   *   console.log(`${count} utilisateurs invalidés`)
   *   
   *   return Response.json({ success: true, invalidated: count })
   * }
   * ```
   */
  static onOrganizationChange(orgSlug: string): number {
    const deleted = removeUsersByOrg(orgSlug)
    
    console.log(`[Cache] ✅ ${deleted} utilisateurs invalidés pour l'org ${orgSlug}`)
    
    return deleted
  }

  /**
   * Invalide le cache après suppression d'une organisation
   * Vérifie à la fois organization et organizations[]
   * 
   * @param orgSlug - Slug de l'organisation supprimée
   * @returns Nombre d'utilisateurs invalidés
   * 
   * @example
   * ```typescript
   * // Dans ton API route DELETE /api/organizations/:slug
   * export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
   *   const orgSlug = params.slug
   *   
   *   // Suppression en base
   *   await deleteOrganization(orgSlug)
   *   
   *   // Invalider tous les utilisateurs ayant accès à cette org
   *   const count = CacheInvalidation.onOrganizationDeleted(orgSlug)
   *   
   *   return Response.json({ success: true, invalidated: count })
   * }
   * ```
   */
  static onOrganizationDeleted(orgSlug: string): number {
    const deleted = removeUsersByOrgAccess(orgSlug)
    
    console.log(`[Cache] ✅ ${deleted} utilisateurs invalidés (org supprimée: ${orgSlug})`)
    
    return deleted
  }

  /**
   * Invalide plusieurs utilisateurs en une seule fois
   * 
   * @param userIds - Liste des IDs utilisateurs
   * @returns Nombre d'utilisateurs invalidés
   * 
   * @example
   * ```typescript
   * // Après import en masse
   * const userIds = ['user1', 'user2', 'user3']
   * const count = CacheInvalidation.onBulkUserUpdate(userIds)
   * console.log(`${count} utilisateurs invalidés`)
   * ```
   */
  static onBulkUserUpdate(userIds: string[]): number {
    let deleted = 0
    
    for (const userId of userIds) {
      if (removeUser(userId)) {
        deleted++
      }
    }
    
    console.log(`[Cache] ✅ ${deleted}/${userIds.length} utilisateurs invalidés (bulk)`)
    
    return deleted
  }

  /**
   * Reset complet du cache
   * ⚠️ À utiliser avec précaution !
   * 
   * @example
   * ```typescript
   * // Déploiement ou maintenance
   * CacheInvalidation.reset()
   * ```
   */
  static reset(): void {
    const stats = getCacheStats()
    clearCache()
    console.log(`[Cache] ⚠️ Cache complètement vidé (${stats.size} utilisateurs supprimés)`)
  }

  /**
   * Affiche les statistiques actuelles du cache
   * 
   * @example
   * ```typescript
   * // Dans un endpoint de monitoring
   * export async function GET() {
   *   const stats = CacheInvalidation.getStats()
   *   return Response.json(stats)
   * }
   * ```
   */
  static getStats() {
    const global = getCacheStats()
    const byOrg = getCacheStatsByOrg()
    
    return {
      total: global.size,
      maxSize: global.maxSize,
      usage: `${((global.size / global.maxSize) * 100).toFixed(1)}%`,
      byOrganization: Object.fromEntries(byOrg)
    }
  }

  /**
   * Affiche un rapport détaillé du cache dans la console
   * 
   * @example
   * ```typescript
   * // Pour debug
   * CacheInvalidation.logReport()
   * ```
   */
  static logReport(): void {
    const stats = this.getStats()
    
    console.log('\n📊 RAPPORT CACHE UTILISATEUR')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Total: ${stats.total}/${stats.maxSize} (${stats.usage})`)
    console.log('\nPar organisation:')
    
    for (const [slug, count] of Object.entries(stats.byOrganization)) {
      console.log(`  - ${slug}: ${count} utilisateurs`)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }
}

/**
 * EXEMPLES D'UTILISATION DANS TON APP
 * 
 * @example
 * ```typescript
 * // ============================================
 * // 1. API Route - Mise à jour utilisateur
 * // ============================================
 * // src/app/api/users/[id]/route.ts
 * import { CacheInvalidation } from '@/services/users/cache-invalidation'
 * 
 * export async function PATCH(
 *   req: Request,
 *   { params }: { params: { id: string } }
 * ) {
 *   const userId = params.id
 *   const updates = await req.json()
 *   
 *   // Mise à jour en base
 *   await db.user.update({
 *     where: { id: userId },
 *     data: updates
 *   })
 *   
 *   // Invalider le cache
 *   CacheInvalidation.onUserUpdate(userId)
 *   
 *   return Response.json({ success: true })
 * }
 * 
 * 
 * // ============================================
 * // 2. API Route - Mise à jour organisation
 * // ============================================
 * // src/app/api/organizations/[slug]/route.ts
 * import { CacheInvalidation } from '@/services/users/cache-invalidation'
 * 
 * export async function PUT(
 *   req: Request,
 *   { params }: { params: { slug: string } }
 * ) {
 *   const orgSlug = params.slug
 *   const updates = await req.json()
 *   
 *   // Mise à jour en base
 *   await db.organization.update({
 *     where: { slug: orgSlug },
 *     data: updates
 *   })
 *   
 *   // Invalider tous les utilisateurs de cette org
 *   const count = CacheInvalidation.onOrganizationChange(orgSlug)
 *   
 *   return Response.json({ 
 *     success: true, 
 *     invalidatedUsers: count 
 *   })
 * }
 * 
 * export async function DELETE(
 *   req: Request,
 *   { params }: { params: { slug: string } }
 * ) {
 *   const orgSlug = params.slug
 *   
 *   // Suppression en base
 *   await db.organization.delete({
 *     where: { slug: orgSlug }
 *   })
 *   
 *   // Invalider tous les utilisateurs ayant accès
 *   const count = CacheInvalidation.onOrganizationDeleted(orgSlug)
 *   
 *   return Response.json({ 
 *     success: true, 
 *     invalidatedUsers: count 
 *   })
 * }
 * 
 * 
 * // ============================================
 * // 3. Server Action - Changement de rôle
 * // ============================================
 * // src/actions/users.ts
 * "use server"
 * import { CacheInvalidation } from '@/services/users/cache-invalidation'
 * 
 * export async function changeUserRole(userId: string, newRole: string) {
 *   // Mise à jour en base
 *   await db.user.update({
 *     where: { id: userId },
 *     data: { role: newRole }
 *   })
 *   
 *   // Invalider le cache
 *   CacheInvalidation.onUserUpdate(userId)
 *   
 *   // Important: forcer le refresh pour le prochain appel
 *   // L'utilisateur verra ses nouvelles permissions immédiatement
 *   return { success: true }
 * }
 * 
 * 
 * // ============================================
 * // 4. Composant - Afficher les stats
 * // ============================================
 * // src/app/admin/cache-stats/page.tsx
 * import { CacheInvalidation } from '@/services/users/cache-invalidation'
 * 
 * export default function CacheStatsPage() {
 *   const stats = CacheInvalidation.getStats()
 *   
 *   return (
 *     <div>
 *       <h1>Cache Utilisateur</h1>
 *       <p>Total: {stats.total}/{stats.maxSize} ({stats.usage})</p>
 *       
 *       <h2>Par Organisation</h2>
 *       <ul>
 *         {Object.entries(stats.byOrganization).map(([slug, count]) => (
 *           <li key={slug}>{slug}: {count} utilisateurs</li>
 *         ))}
 *       </ul>
 *       
 *       <button onClick={() => CacheInvalidation.reset()}>
 *         Vider le cache
 *       </button>
 *     </div>
 *   )
 * }
 * 
 * 
 * // ============================================
 * // 5. Webhook - Import utilisateurs en masse
 * // ============================================
 * // src/app/api/webhooks/bulk-import/route.ts
 * import { CacheInvalidation } from '@/services/users/cache-invalidation'
 * 
 * export async function POST(req: Request) {
 *   const { users } = await req.json()
 *   
 *   // Import en masse
 *   const userIds = await bulkImportUsers(users)
 *   
 *   // Invalider tous les utilisateurs importés
 *   const invalidated = CacheInvalidation.onBulkUserUpdate(userIds)
 *   
 *   return Response.json({ 
 *     imported: userIds.length,
 *     invalidated 
 *   })
 * }
 * 
 * 
 * // ============================================
 * // 6. Cron Job - Monitoring quotidien
 * // ============================================
 * // src/app/api/cron/cache-monitoring/route.ts
 * import { CacheInvalidation } from '@/services/users/cache-invalidation'
 * 
 * export async function GET() {
 *   const stats = CacheInvalidation.getStats()
 *   
 *   // Logger les stats
 *   console.log(`[Monitoring] Cache: ${stats.usage} utilisé`)
 *   
 *   // Alerter si le cache est plein
 *   if (stats.total / stats.maxSize > 0.9) {
 *     await sendAlert('Cache utilisateur à 90%')
 *   }
 *   
 *   return Response.json({ stats })
 * }
 * 
 * 
 * // ============================================
 * // 7. Middleware - Forcer refresh après update
 * // ============================================
 * // src/middleware.ts
 * import { getUserInfo } from '@/services/users/getUserInfo'
 * 
 * export async function middleware(req: NextRequest) {
 *   // Vérifier si c'est une requête après mise à jour
 *   const forceRefresh = req.headers.get('x-force-refresh') === 'true'
 *   
 *   // Récupérer les infos utilisateur
 *   const user = await getUserInfo({ 
 *     refresh: forceRefresh 
 *   })
 *   
 *   // ...
 * }
 * 
 * 
 * // ============================================
 * // 8. Script de déploiement
 * // ============================================
 * // scripts/clear-cache-on-deploy.ts
 * import { CacheInvalidation } from '@/services/users/cache-invalidation'
 * 
 * async function main() {
 *   console.log('🚀 Déploiement en cours...')
 *   
 *   // Vider le cache avant déploiement
 *   CacheInvalidation.reset()
 *   
 *   console.log('✅ Cache vidé avec succès')
 * }
 * 
 * main()
 * ```
 */