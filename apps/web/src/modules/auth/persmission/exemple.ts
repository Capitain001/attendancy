const actions = {
    READ: "Voir",
    CREATE: "Créer",
    UPDATE: "Modifier",
    DELETE: "Supprimer",
  } as const;
  
  const resources = {
    COURSE: "les cours",
    USER: "les utilisateurs",
  } as const;

  

  export function permissionName(
    action: keyof typeof actions,
    resource?: keyof typeof resources | null
  ) {
    if (!resource) {
      return actions[action];
    }
  
    return `${actions[action]} ${resources[resource]}`;
  }

  
  permissionName("CREATE", "COURSE"); 
// → "Voir les cours"

permissionName("UPDATE", "USER"); 
// → "Modifier les utilisateurs"

permissionName("READ"); 
// → "Voir"
