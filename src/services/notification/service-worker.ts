// Migration progressive — re-export vers @/modules/notification
// Consommateurs : migrer les imports vers `from '@/modules/notification'`
export {
  registerServiceWorker,
  getServiceWorkerRegistration,
  getCurrentSubscription,
} from '@/modules/notification'
