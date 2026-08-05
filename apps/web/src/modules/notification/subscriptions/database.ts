// src/services/notification/database.ts

import { PUSH_SUBSCRIPTION_DURATION } from "@/config";
import { prisma } from "@/lib/prisma";
import { tryCatch } from "@/utils/server";



export interface PushSubscriptionData {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  deviceId?: string;
  expiresAt?: Date;
}

// Créer ou mettre à jour un abonnement
export async function upsertPushSubscription(data: PushSubscriptionData) {
  return tryCatch(
    prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        userId: data.userId, // Correction importante
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        expiresAt: data.expiresAt,
        updatedAt: new Date()
      },
      create: {
        userId: data.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        expiresAt: data.expiresAt || new Date(Date.now() + PUSH_SUBSCRIPTION_DURATION)
      }
    })
  );
}

// Trouver un abonnement par endpoint
export async function findPushSubscriptionByEndpoint(endpoint: string) {
  return tryCatch(
    prisma.pushSubscription.findUnique({
      where: { endpoint }
    })
  );
}

// Trouver tous les abonnements d'un utilisateur
export async function findPushSubscriptionsByUserId(userId: string) {
  return tryCatch(
    prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })
  );
}

// Désabonner un appareil spécifique
export async function unsubscribeDevice(data: { userId: string; endpoint: string }) {
  return tryCatch(
    prisma.pushSubscription.delete({
      where: {
        endpoint_userId: {
          endpoint: data.endpoint,
          userId: data.userId
        }
      }
    })
  );
}

// Désabonner tous les appareils d'un utilisateur
export async function unsubscribeAllDevices(userId: string) {
  return tryCatch(
    prisma.pushSubscription.deleteMany({
      where: { userId }
    })
  );
}

// Supprimer les abonnements expirés
export async function cleanupExpiredSubscriptions() {
  return tryCatch(
    prisma.pushSubscription.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
  );
}

// Marquer un abonnement comme expiré
export async function markSubscriptionAsExpired(endpoint: string) {
  return tryCatch(
    prisma.pushSubscription.update({
      where: { endpoint },
      data: {
        expiresAt: new Date()
      }
    })
  );
}

// Compter les appareils actifs d'un utilisateur
export async function countUserDevices(userId: string) {
  return tryCatch(
    prisma.pushSubscription.count({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      }
    })
  );
}

// Récupérer les statistiques
export async function getSubscriptionStats() {
  return tryCatch(
    (async () => {
      const totalSubscriptions = await prisma.pushSubscription.count();
      const activeSubscriptions = await prisma.pushSubscription.count({
        where: { expiresAt: { gt: new Date() } }
      });
      const expiredSubscriptions = await prisma.pushSubscription.count({
        where: { expiresAt: { lte: new Date() } }
      });
      const uniqueUsers = await prisma.pushSubscription.groupBy({
        by: ["userId"],
        _count: { userId: true }
      });

      return {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        uniqueUsers: uniqueUsers.length
      };
    })()
  );
}

// Vérifier si un utilisateur a des abonnements actifs
export async function hasActiveSubscriptions(userId: string) {
  return tryCatch(
    prisma.pushSubscription.count({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      }
    }).then((count) => count > 0)
  );
}



// const subscription = await prisma.subscription.Subscibe()
