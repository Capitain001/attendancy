// Migration progressive — re-export vers @/modules/notification
// Consommateurs : migrer les imports vers `from '@/modules/notification'`
export {
  urlBase64ToUint8Array,
  serializeSubscription,
  checkBrowserSupport,
  validateHTTPS,
  getCurrentPermission,
} from '@/modules/notification'

