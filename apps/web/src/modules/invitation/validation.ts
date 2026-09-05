import * as v from 'valibot';

/**
 * Schéma Valibot partagé pour la validation d'email
 */
export const emailSchema = v.pipe(
  v.string("L'email doit être une chaîne de caractères"),
  v.email("Format d'email invalide")
);

/**
 * Utilité côté client pour valider un email de manière synchrone
 * (Utile pour griser le bouton submit d'un formulaire)
 */
export function isValidEmail(email: string): boolean {
  return v.safeParse(emailSchema, email).success;
}
