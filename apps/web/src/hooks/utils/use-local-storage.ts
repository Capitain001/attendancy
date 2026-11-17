// src/hooks/useLocalStorage.ts
'use client'

import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'

// L'événement natif `storage` ne se déclenche que dans les AUTRES onglets :
// on émet notre propre événement pour prévenir les hooks du même onglet.
const LOCAL_EVENT = 'local-storage'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(LOCAL_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(LOCAL_EVENT, onChange)
  }
}

function readRaw(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null // stockage indisponible (mode privé, quota, politique du navigateur)
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue)

  // Le snapshot est la chaîne brute, jamais l'objet parsé : React compare les snapshots
  // avec Object.is, et un JSON.parse renverrait une nouvelle référence à chaque appel
  // (boucle de rendus infinie pour un objet ou un tableau).
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null, // rendu serveur et hydratation : pas de localStorage, donc valeur initiale
  )

  const value = useMemo(() => parse(raw, initialRef.current), [raw])

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      try {
        // Relit la valeur fraîche plutôt que celle d'une fermeture : pas de valeur périmée
        const prev = parse(readRaw(key), initialRef.current)
        const resolved = next instanceof Function ? next(prev) : next
        window.localStorage.setItem(key, JSON.stringify(resolved))
        window.dispatchEvent(new Event(LOCAL_EVENT))
      } catch (error) {
        console.error(`Erreur d'écriture localStorage "${key}":`, error)
      }
    },
    [key],
  )

  return [value, setValue] as const
}