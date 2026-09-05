// Dans vos composants ou API routes
import { UserInfo } from '@/types';
import { authorize, checkResourcePermission } from './autorization';
import { createPermission, hasAnyPermission } from './utils';

/* 

mettre a jour la permission
*/
// Exemple complet
const permissions = ["CREATE:USER", "READ:COURSE", "UPDATE:STUDENT"];

// const { error } = await supabase.auth.updateUser({
//   data: {
//     organization: {
//       permissions: permissions // ← Directement ici
//     }
//   }
// });

// if (error) {
//   console.error("Erreur:", error.message);
// } else {
//   console.log("Permissions mises à jour");
// }

// {
//   "organization": {
//     "permissions": ["CREATE:USER", "READ:COURSE", "UPDATE:STUDENT"]
//   }
// }


// services/permission-update.service.ts
// import { transformPrismaPermissionsToSupabase } from "@/utils/permission-transformers";

// export async function updateUserPermissions(userId: string) {
//   try {
//     // Récupère les permissions
//     const permissionsFromPrisma = await prisma.permission.findMany({
//       where: { 
//         userId, 
//         isActive: true,
//         OR: [
//           { expiresAt: null },
//           { expiresAt: { gt: new Date() } }
//         ]
//       },
//       select: { action: true, resource: true, resourceId: true }
//     });

//     // Transforme
//     const permissions = transformPrismaPermissionsToSupabase(permissionsFromPrisma);

//     // Met à jour Supabase
//     const { error } = await supabase.auth.updateUser({
//       data: { organization: { permissions } }
//     });

//     if (error) throw error;
    
//     return permissions;
    
//   } catch (error) {
//     console.error("Erreur mise à jour permissions:", error);
//     throw error;
//   }
// }







// const user: UserInfo = null;

// Vérification simple de rôle
// const authresult = await authorize(user, 'TEACHER');
// if (!authresult.success) {

//   throw new Error('Permission manquante');
// }

// // Vérification rôle + permission
// const result = await authorize(user, 'ADMIN', createPermission('CREATE', 'USER'));
// if (!result.success) {
//   return Response.json({ error: result.error }, { status: 403 });
// }
// const courseId = '123';
// // // Vérification permission granulaire
// const result = await checkResourcePermission(
//   user, 
//   'UPDATE', 
//   'COURSE', 
//   courseId
// );
// if (!result.success) {
//   // Gérer l'erreur d'autorisation
// }

// // Vérification multiple
// const canManageUsers = await hasAnyPermission(user, [
//   createPermission('CREATE', 'USER'),
//   createPermission('UPDATE', 'USER'),
//   createPermission('DELETE', 'USER')
// ]);
