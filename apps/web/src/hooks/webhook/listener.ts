// hooks/webhook/listener.ts
"use client"

// hooks/useWebhookListener.ts
import { useEffect } from 'react';

type WebhookEvent = {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  old_data?: any;
};

export const useWebhookListener = (onPayload: (event: WebhookEvent) => void) => {
  useEffect(() => {
    // 🎯 SIMULATION WEBHOOK - Dans la réalité, ça serait WebSocket/SSE
    const simulateWebhook = () => {
      const events: WebhookEvent[] = [
        // Événement 1: Nouvel enseignant
        {
          table: 'teachers',
          action: 'INSERT',
          data: {
            id: `teacher-${Date.now()}`,
            name: 'Nouveau Prof Webhook',
            email: `webhook-${Date.now()}@ecole.fr`,
            subject: 'Informatique',
            status: 'ACTIVE',
            createdAt: new Date()
          }
        },
        // Événement 2: Mise à jour
        {
          table: 'teachers', 
          action: 'UPDATE',
          data: {
            id: '1',
            name: 'Alice Dupont (Mis à jour via Webhook)',
            email: 'alice.new@ecole.fr',
            subject: 'Mathématiques Avancées',
            status: 'ACTIVE',
            createdAt: new Date('2024-01-15')
          },
          old_data: {
            id: '1',
            name: 'Alice Dupont',
            email: 'alice@ecole.fr',
            subject: 'Mathématiques',
            status: 'ACTIVE', 
            createdAt: new Date('2024-01-15')
          }
        },
        // Événement 3: Suppression
        {
          table: 'teachers',
          action: 'DELETE',
          data: {
            id: '1',
            name: 'Alice Dupont (Mis à jour via Webhook)',
            email: 'alice.new@ecole.fr',
            subject: 'Mathématiques Avancées',
            status: 'ACTIVE',
            createdAt: new Date('2024-01-15')
          },
          old_data: {
            id: '2',
            name: 'Bernard Martin',
            email: 'bernard@ecole.fr',
            subject: 'Français',
            status: 'ACTIVE',
            createdAt: new Date('2024-01-20')
          }
        }
      ];

      // 🔄 Émettre un événement aléatoire toutes les 5-10 secondes
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      console.log('🌐 Webhook simulé reçu:', randomEvent);
      onPayload(randomEvent);
    };

    // Démarrer la simulation
    const interval = setInterval(simulateWebhook, 5000 + Math.random() * 5000);
    
    return () => clearInterval(interval);
  }, [onPayload]);
};