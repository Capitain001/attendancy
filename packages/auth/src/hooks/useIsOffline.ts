import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";
import { useAuth } from "../AuthProvider";

// onlineManager est un store externe : useSyncExternalStore re-rend le composant
// à chaque changement, sans useEffect ni useState.
const subscribe = (onChange: () => void) =>
  onlineManager.subscribe(() => onChange());
const getSnapshot = () => onlineManager.isOnline();

export function useIsOffline() {
  // L'appareil n'a pas de connexion réseau (navigator.onLine).
  const isDeviceOffline = !useSyncExternalStore(subscribe, getSnapshot);

  // L'appareil se croit en ligne, mais le renouvellement de session a échoué
  // faute de réseau (Wi-Fi sans internet, serveur injoignable). Dans cet état la
  // requête currentUser est désactivée : cette ligne est alors le seul signal.
  const isSessionStale = useAuth()?.status === "offline-stale";

  return isDeviceOffline || isSessionStale;
}