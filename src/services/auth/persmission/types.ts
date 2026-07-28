//src/services/permission/types.ts

/**
 * Actions possibles sur les ressources
 */
export const PermissionActions = {
    CREATE: "CREATE",
    READ: "READ", 
    UPDATE: "UPDATE",
    DELETE: "DELETE"
  } as const;
  
  export type PermissionAction = typeof PermissionActions[keyof typeof PermissionActions];
  
  /**
   * Ressources du système
   */
  export const PermissionResources = {
    COURSE: "COURSE",
    SCHEDULE: "SCHEDULE", 
    USER: "USER",
    ROOM: "ROOM",
    LOCATION: "LOCATION",
    CLASS: "CLASS",
    STUDENT: "STUDENT",
    ATTENDANCE: "ATTENDANCE",
    GRADE: "GRADE"
  } as const;
  
  export type PermissionResource = typeof PermissionResources[keyof typeof PermissionResources];
  
  /**
   * Représente une permission spécifique
   * @example { action: 'CREATE', resource: 'USER' } - Permet de créer des utilisateurs
   * @example { action: 'UPDATE', resource: 'COURSE', resourceId: '123' } - Permet de modifier un cours spécifique
   */
  export interface Permission {
    action: PermissionAction;
    resource: PermissionResource;
    resourceId?: string;
    description?: string;
  }
  
  /**
   * Résultat d'une vérification d'autorisation
   */
  export type AuthorizationResult = 
    | { success: true }
    | { success: false; error: string };