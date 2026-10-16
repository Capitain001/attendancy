// lib/data/schedule.ts  (.ts à nouveau, plus de JSX)
export const scheduleCountdownMessages = {
  upcoming: 'Cours suivant dans',
  awaiting: 'Pas encore démarré',
  running: 'En cours · fin dans',
} as const

/** Décompte prêt à afficher : le texte, et le temps restant s'il y en a un. */
export type ScheduleCountdown = {
  message: string
  time: string | null
}