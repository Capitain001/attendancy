// src/config/url.ts
// URLs canoniques du projet — toujours dérivées de SITE_URL, jamais codées en
// dur dans les composants ou services.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Callback OAuth / email de confirmation Supabase
export const CALL_BACK = `${SITE_URL}/auth/callback`

// Page de relay Supabase pour les invitations (lit les hash tokens côté client)
export const INVITE_URL = `${SITE_URL}/auth/invite`

// Route frontend d'émargement étudiant (scan QR)
export const SESSION_ATTENDANCE_URL = `${SITE_URL}/session/attendance`

export const buildSessionUrl = (token: string) =>
  `${SESSION_ATTENDANCE_URL}?token=${token}`
