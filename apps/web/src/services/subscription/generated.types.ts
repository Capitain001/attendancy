// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts subscription
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createSubscription, updateSubscriptionStatus, getPlans, getSubscription } from './database'

export type CreateSubscriptionDto = Awaited<ReturnType<typeof createSubscription>>
export type UpdateSubscriptionStatusDto = Awaited<ReturnType<typeof updateSubscriptionStatus>>
export type GetPlansDto = Awaited<ReturnType<typeof getPlans>>
export type GetSubscriptionDto = Awaited<ReturnType<typeof getSubscription>>
