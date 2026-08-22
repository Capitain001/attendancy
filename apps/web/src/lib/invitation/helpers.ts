"use client";

import { useState } from "react";

/**
 * Hook utilitaire pour gérer un état de chargement granulaire (busyKind).
 * Permet de savoir exactement quelle action est en cours (ex: "sms", "whatsapp", "resend")
 * pour afficher le bon spinner sur le bon bouton, plutôt qu'un chargement global.
 */
export function useBusyKind<T extends string = string>() {
  const [busyKind, setBusyKind] = useState<T | null>(null);

  /**
   * Enveloppe une fonction asynchrone pour activer automatiquement le `busyKind` 
   * au début de l'exécution, puis le remettre à `null` à la fin (succès ou erreur).
   */
  const execute = async <R>(kind: T, action: () => Promise<R>): Promise<R> => {
    setBusyKind(kind);
    try {
      return await action();
    } finally {
      setBusyKind(null);
    }
  };

  return {
    /** L'action actuellement en cours de chargement (ou null) */
    busyKind,
    /** Change manuellement l'action en cours */
    setBusyKind,
    /** Vrai si n'importe quelle action est en cours */
    isBusy: busyKind !== null,
    /** Vérifie si une action spécifique est en cours */
    isBusyWith: (kind: T) => busyKind === kind,
    /** Lance une action asynchrone en gérant automatiquement l'état busyKind */
    execute,
  };
}