// src/config/url.ts

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
// export const SUBSCRIPTION_URL = `${SITE_URL}/subscription`;
export const SUBSCRIPTION_URL = "/subscription";
export const SUCCESS_URL = `${SUBSCRIPTION_URL}/success`;
export const CANCEL_URL = `${SUBSCRIPTION_URL}/cancel`;

export const CALL_BACK = `${SITE_URL}/auth/callback`

// URL de redirection après authentification OAuth
export const AUTH_PROVIDER_URL = `${SITE_URL}/auth/provider?refresh=true`;

export const INVITE_URL = `${SITE_URL}/auth/invite`;   
export const WELCOME_URL = `${SITE_URL}/auth/welcome`;

// URL de redirection après authentification
// export const LOGIN_URL = `${SITE_URL}/login`;
export const PROFILE_URL = `${SITE_URL}/auth/profile`;
export const REDIRECT_URL = `${SITE_URL}/redirect`;


// ==================== SESSION ====================

//  Route frontend de présence étudiant
export const SESSION_ATTENDANCE_URL =
  `${SITE_URL}/session/attendance`;

// Builder avec token
export const buildSessionUrl = (token: string) =>
  `${SESSION_ATTENDANCE_URL}?token=${token}`;
