//src/config/session.ts
export interface SessionState {
    status: "upcoming" | "check-in-available" | "ongoing" | "check-out-available" | "completed";
    checkTime: string;          // Seulement le temps formaté (ex: "5m", "1h 12m")
    canCheckIn: boolean;
    canCheckOut: boolean;
    timeUntilStart: number;
    timeUntilEnd: number;
    progressPercent: number;
  }
export type config = {}


export const statusColors: Record<SessionState["status"], string> = {
    upcoming: "hsl(var(--muted))",
    "check-in-available": "hsl(var(--card))",
    ongoing: "hsl(var(--primary))",
    "check-out-available": "hsl(var(--secondary))",
    completed: "hsl(var(--destructive))",
};

// Configuration des sessions
export const sessionConfig = {
  // Seuils de temps pour les actions
  thresholds: {
    checkIn: 15, // minutes avant le début pour permettre le check-in
    checkOut: 15, // minutes après la fin pour permettre le check-out
  },
  
  // Configuration du timer
  timer: {
    updateInterval: 1000, // millisecondes (1 seconde)
    staleTime: 1000 * 60 * 5, // 5 minutes pour React Query
  },
  
  // Configuration des statuts
  status: {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
  
  // Configuration des schedules
  schedule: {
    status: {
      PENDING: 'PENDING',
      ONGOING: 'ONGOING',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    },
  },
  
  // Messages d'erreur et de succès
  messages: {
    startSuccess: "Session démarrée avec succès!",
    startError: "Erreur lors du démarrage de la session",
    missingScheduleId: "ID du planning manquant",
    sessionRetrievalError: "Erreur lors de la récupération de la session",
  },
  
  // Configuration des requêtes React Query
  queryKeys: {
    activeSession: (scheduleId: string) => ["active-session", scheduleId],
    courseInfo: (courseId: string) => ["course-info", courseId],
    todaySchedules: (teacherId: string) => ["today-schedules", teacherId],
  },
} as const;

// Types dérivés de la configuration
export type SessionThresholds = typeof sessionConfig.thresholds;
export type SessionStatus = typeof sessionConfig.status.ACTIVE | typeof sessionConfig.status.COMPLETED | typeof sessionConfig.status.CANCELLED;
export type ScheduleStatus = typeof sessionConfig.schedule.status[keyof typeof sessionConfig.schedule.status];
