// utils/permission-helpers.ts
import { UserInfo } from "@/types";
import { Permission, PermissionAction, PermissionResource } from "@/types/permissions";
import { userHasPermission } from "./autorization";

/**
 * Crée un objet Permission de manière type-safe
 * @param action - Action de la permission
 * @param resource - Ressource concernée
 * @param resourceId - ID spécifique de la ressource (optionnel)
 * @returns Objet Permission typé
 * 
 * @example
 * const canCreateUsers = createPermission('CREATE', 'USER');
 * const canUpdateCourse = createPermission('UPDATE', 'COURSE', 'course-123');
 */
export function createPermission(
  action: PermissionAction, 
  resource: PermissionResource, 
  resourceId?: string
): Permission {
  return { action, resource, resourceId };
}

/**
 * Convertit une string en objet Permission
 * @param permissionString - String au format "action:resource" ou "action:resource:id"
 * @returns Objet Permission ou null si le format est invalide
 * 
 * @example
 * const permission = parsePermission("CREATE:USER");
 * // Returns { action: 'CREATE', resource: 'USER' }
 */
export function parsePermission(permissionString: string): Permission | null {
  const parts = permissionString.split(':');
  
  if (parts.length < 2) return null;
  
  return {
    action: parts[0] as PermissionAction,
    resource: parts[1] as PermissionResource,
    resourceId: parts[2] || undefined
  };
}

/**
 * Convertit un objet Permission en string
 * @param permission - Objet Permission à convertir
 * @returns String au format "action:resource" ou "action:resource:id"
 * 
 * @example
 * const permissionString = stringifyPermission({
 *   action: 'UPDATE',
 *   resource: 'COURSE',
 *   resourceId: '123'
 * });
 * // Returns "UPDATE:COURSE:123"
 */
export function stringifyPermission(permission: Permission): string {
  return `${permission.action}:${permission.resource}${permission.resourceId ? `:${permission.resourceId}` : ''}`;
}

/**
 * Récupère toutes les permissions d'un utilisateur sous forme d'objets typés
 * @param user - Informations de l'utilisateur
 * @returns Tableau d'objets Permission
 */
export function getUserPermissions(user: UserInfo): Permission[] {
  if (!user.organization?.permissions) return [];
  
  return user.organization.permissions
    .map(parsePermission)
    .filter((p): p is Permission => p !== null);
}

/**
 * Vérifie si l'utilisateur a au moins une des permissions demandées
 * @param user - Informations de l'utilisateur
 * @param permissions - Liste des permissions à vérifier
 * @returns true si l'utilisateur a au moins une des permissions
 * 
 * @example
 * const canManageUsers = await hasAnyPermission(user, [
 *   createPermission('CREATE', 'USER'),
 *   createPermission('UPDATE', 'USER'),
 *   createPermission('DELETE', 'USER')
 * ]);
 */
export async function hasAnyPermission(
  user: UserInfo, 
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await userHasPermission(user, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Vérifie si l'utilisateur a toutes les permissions demandées
 * @param user - Informations de l'utilisateur
 * @param permissions - Liste des permissions à vérifier
 * @returns true si l'utilisateur a toutes les permissions
 */
export async function hasAllPermissions(
  user: UserInfo, 
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await userHasPermission(user, permission))) {
      return false;
    }
  }
  return true;
}



// utils/permission-transformers.ts


/**
 * Transforme les permissions Prisma en format string pour Supabase
 * @param permissionsFromPrisma - Permissions récupérées depuis Prisma
 * @returns Tableau de strings au format "action:resource" ou "action:resource:resourceId"
 * 
 * @example
 * const permissions = await prisma.permission.findMany({ ... });
 * const permissionStrings = transformPrismaPermissionsToSupabase(permissions);
 * // → ["CREATE:USER", "READ:COURSE", "UPDATE:STUDENT:123"]
 */
export function transformPrismaPermissionsToSupabase(
  permissionsFromPrisma: { action: string; resource: string; resourceId?: string | null }[]
): string[] {
  return permissionsFromPrisma
    .filter(p => p.action && p.resource) // Sécurité : ignore les permissions incomplètes
    .map(p => 
      p.resourceId 
        ? `${p.action}:${p.resource}:${p.resourceId}`
        : `${p.action}:${p.resource}`
    );
}

/**
 * Version avec typage fort pour les actions et ressources
 */
export function transformPrismaPermissionsToSupabaseTyped(
  permissionsFromPrisma: { 
    action: string; 
    resource: string; 
    resourceId?: string | null 
  }[]
): string[] {
  return transformPrismaPermissionsToSupabase(permissionsFromPrisma);
}




/* 
import { transformPrismaPermissionsToSupabase } from "@/utils/permission-transformers";

// Récupère les permissions depuis Prisma
const permissionsFromPrisma = await prisma.permission.findMany({
  where: { userId: "user-id", isActive: true },
  select: { action: true, resource: true, resourceId: true }
});

// Transforme en format Supabase
const permissions = transformPrismaPermissionsToSupabase(permissionsFromPrisma);

// Met à jour Supabase
await supabase.auth.updateUser({
  data: {
    organization: {
      permissions: permissions
    }
  }
});

*/



/*  */

// utils/permission-transformers.ts
/**
 * Transforme les permissions Prisma en une seule ligne
 */
export const transformPermissions = (permissions: any[]) => 
    permissions
      .filter(p => p.action && p.resource)
      .map(p => p.resourceId ? `${p.action}:${p.resource}:${p.resourceId}` : `${p.action}:${p.resource}`);
  
  // Utilisation :
  const permissionsFromPrisma = [
    { action: "CREATE", resource: "USER" },
    { action: "READ", resource: "COURSE" },
    { action: "UPDATE", resource: "STUDENT", resourceId: "123" }
  ];
  const permissions = transformPermissions(permissionsFromPrisma);



  