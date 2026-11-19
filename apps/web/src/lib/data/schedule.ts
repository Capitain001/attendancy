// src/lib/data/schedule.ts
export const scheduleCountdownMessages = {
  upcoming: 'Commence dans',
  awaiting: 'Pas encore démarré',
  running: 'En cours · fin dans',
} as const

export const scheduleListMessages = {
  title: 'Cours de la journée',
  empty: "Aucun cours aujourd'hui",
  progress: (done: number, total: number) => `${done}/${total} terminés`,
} as const

export const scheduleStartMessages = {
  start: 'Démarrer la séance',
} as const

/** Décompte prêt à afficher : le message, et le temps restant s'il y en a un. */
export type ScheduleCountdown = {
  message: string
  time: string | null
}