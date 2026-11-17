// // src/modules/chat/send-queued-message.ts
// //
// // Envoie au serveur UN message de la file d'attente hors-ligne et dit au moteur
// // ce qu'il doit en faire. Tourne côté client ; appelé par le moteur à chaque flush.
// //
// //   outbox (stockage local)  →  sendQueuedMessage(item)  →  sendMessageAction (serveur)
// //                                        ↓
// //                      { data } livré · { error } refus définitif · { retry } plus tard
// import type { OutboxItem, SendResult } from '@attendancy/chat'
// import { ERROR_CODES, type ApiResponse, type ErrorCode } from '@/config'
// import { sendMessageAction } from '@/services/message'
// import { MESSAGE } from '@/services/message/policy'

// // Seule la file hors-ligne traite ces codes comme « réessaie plus tard ».
// const RETRYABLE = new Set<ErrorCode>([
//   ERROR_CODES.UNAUTHORIZED, // token expiré après un long hors-ligne
//   ERROR_CODES.SERVER, // panne serveur : le message n'est pas en cause
//   ...MESSAGE.RETRYABLE_CODES, // règle du domaine (parent pas encore synchronisé)
// ])

// const toSendResult = (r: ApiResponse<unknown>): SendResult =>
//   'error' in r && r.code && RETRYABLE.has(r.code) ? { retry: true } : r

// export async function sendQueuedMessage(item: OutboxItem): Promise<SendResult> {
//   // Une entrée d'outbox porte aussi userId, status, error : des champs LOCAUX
//   // qui ne partent jamais au serveur. On n'envoie que les 5 champs du message.
//   const { id, content, channelId, parentId, createdAt } = item
//   const response = await sendMessageAction({ id, content, channelId, parentId, createdAt })
//   return toSendResult(response)
// }