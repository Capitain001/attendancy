// Migration progressive — re-export vers @/modules/notification
// Consommateurs : migrer les imports vers `from '@/modules/notification'`
export {
  isVapidConfigured,
  buildPushPayload,
  sendToDevice,
  analyzeSendResults,
} from '@/modules/notification'
