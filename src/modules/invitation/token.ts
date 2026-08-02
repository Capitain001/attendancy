/**
 * Service de génération de tokens d'invitation sécurisés
 * 
 * @description Génère un token cryptographique unique et définit sa date d'expiration
 * @returns {Promise<{token: string, expiresAt: Date}>} Token et date d'expiration
 * @example
 * const { token, expiresAt } = await generateInvitationToken();
 * // Token expire dans 7 jours
 */

import { randomBytes } from "crypto";

const ALLOWED_EXPIRY_DAYS = [1, 3, 7, 14, 30] as const;

function resolveExpiryDays(expiresInDays?: number): number {
  if (
    typeof expiresInDays === "number" &&
    Number.isInteger(expiresInDays) &&
    (ALLOWED_EXPIRY_DAYS as readonly number[]).includes(expiresInDays)
  ) {
    return expiresInDays;
  }
  return 7;
}

export async function generateInvitationToken(expiresInDays?: number): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + resolveExpiryDays(expiresInDays));

  return { token, expiresAt };
}