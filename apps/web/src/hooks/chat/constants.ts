// src/hooks/chat/constants.ts

// Nom affiché quand l'auteur n'a pas de nom (ou a été supprimé) :
// partagé entre le temps réel et la persistance pour un affichage identique.
export const ANONYMOUS_NAME = 'Anonyme'

// Émission au plus toutes les 2,5 s pendant la frappe
export const TYPING_THROTTLE_MS = 2_500
// Sans nouvel événement depuis 4 s, l'utilisateur n'écrit plus.
// Doit rester supérieur au throttle (marge pour la latence), sinon l'indicateur clignote.
export const TYPING_EXPIRE_MS = 4_000
