
import { colors } from "./utils";
import { Role } from "@/generated/prisma";


// Fonction qui retourne une couleur selon le rôle
export const getRoleColor = (role: Role) => {
    const roleMapping = {
      [Role.ADMIN]: colors[0],      // Green
      [Role.DIRECTION]: colors[1],  // Blue
      [Role.TEACHER]: colors[2],    // Orange
      [Role.STUDENT]: colors[3],    // Red
      [Role.PARENT]: colors[4],     // Pink
      // [Role.SUPER_ADMIN]: colors[5],     // Purple
    };
    
    return roleMapping[role] || '#9E9E9E'; // Gris par défaut si rôle non trouvé
  };