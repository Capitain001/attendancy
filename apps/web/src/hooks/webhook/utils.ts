// utils/webhookAdapter.ts

import { Payload } from "../entity";


export const webhookToPayload = <T>(webhookEvent: any): Payload<T> | null => {
  try {
    switch (webhookEvent.action) {
      case 'INSERT':
        return {
          type: "INSERT",
          record: webhookEvent.data
        };
      
      case 'UPDATE':
        return {
          type: "UPDATE", 
          record: webhookEvent.data,
          old_record: webhookEvent.old_data
        };
      
      case 'DELETE':
        return {
          type: "DELETE",
          old_record: webhookEvent.old_data
        };
      
      default:
        console.warn('⚠️ Action webhook non supportée:', webhookEvent.action);
        return null;
    }
  } catch (error) {
    console.error('❌ Erreur conversion webhook:', error);
    return null;
  }
};