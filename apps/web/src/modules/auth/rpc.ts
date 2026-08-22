// import { createAdminClient } from "@/utils/supabase/server";

// /**
//  * Trouve un utilisateur Auth par son email.
//  *
//  * Un seul aller-retour DB (get_auth_user_by_email) au lieu de listUsers().find() —
//  * et au lieu d'un RPC id-only suivi d'un getUserById séparé : la RPC renvoie
//  * directement id + email_confirmed_at + raw_user_meta_data en une requête.
//  */
// export async function findAuthUserByEmail(email: string) {
//   const supabase = await createAdminClient();
 
//   const { data, error } = await supabase
//     .rpc("get_auth_user_by_email", { user_email: email })
//     .maybeSingle();
 
//   if (error) return { error: error.message };
//   if (!data) return { data: { user: null } };
 
//   return {
//     data: {
//       user: {
//         id: data.id,
//         email,
//         email_confirmed_at: data.email_confirmed_at,
//         user_metadata: data.raw_user_meta_data ?? {},
//       },
//     },
//   };
// }
 