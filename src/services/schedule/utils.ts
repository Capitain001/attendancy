// src/services/schedule/utils.ts
// Selects réutilisables exposés pour les consommateurs du service (planning, etc.)

export const scheduleInclude = {
  course: { select: { id: true, name: true } },
  room: { select: { id: true, name: true } },
  teacher: {
    select: {
      id: true,
      user: {
        select: { firstName: true, lastName: true, avatar_url: true },
      },
    },
  },
  group: { select: { id: true, name: true } },
} as const

export const schedulePlanningInclude = {
  course: { select: { id: true, name: true } },
  room: { select: { id: true, name: true } },
  teacher: {
    select: {
      id: true,
      user: {
        select: { firstName: true, lastName: true },
      },
    },
  },
  group: { select: { id: true, name: true } },
} as const
