// Décodage NON-VÉRIFIÉ du JWT Supabase — acceptable ici car le token vient
// directement de loginWithPassword() dans le même appel serveur (pas d'input
// utilisateur). Ne jamais réutiliser cet helper pour valider une requête
// entrante : ça, c'est le rôle du middleware Supabase (vérification de
// signature), pas de cette fonction.
export function getSessionIdFromAccessToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof decoded.session_id === 'string' ? decoded.session_id : null
  } catch {
    return null
  }
}
 