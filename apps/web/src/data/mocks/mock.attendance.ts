// src/data/mocks/mock.attendance.ts
import { GetTeacherAttendanceOverviewDto } from "@/services/attendance"


/**
 * Génère des données fictives cohérentes pour la vue d'ensemble des présences d'un enseignant.
 */
export function mockGetTeacherAttendanceOverview(
  overrides?: Partial<GetTeacherAttendanceOverviewDto>
): GetTeacherAttendanceOverviewDto {
  return {
    totals: {
      present: 142,
      late: 8,
      absent: 10,
      excused: 5,
      denominator: 160,
      rate: 93.75, // (142 + 8) / 160 * 100
      sessions: 12,
      ...overrides?.totals,
    },
    byCourse: overrides?.byCourse ?? [
      {
        courseId: 'course_1',
        courseName: 'Mathématiques',
        classId: 'class_3a',
        className: 'Terminale A',
        present: 75,
        late: 3,
        absent: 4,
        excused: 2,
        denominator: 82,
        rate: 95.12,
        sessions: 6,
      },
      {
        courseId: 'course_2',
        courseName: 'Physique-Chimie',
        classId: 'class_3b',
        className: 'Terminale B',
        present: 67,
        late: 5,
        absent: 6,
        excused: 3,
        denominator: 78,
        rate: 92.3,
        sessions: 6,
      },
    ],
    absentees: overrides?.absentees ?? [
      {
        studentId: 'student_101',
        firstName: 'Lucas',
        lastName: 'Moreau',
        present: 4,
        late: 1,
        absent: 5,
        excused: 1,
        denominator: 10,
        rate: 50.0,
      },
      {
        studentId: 'student_102',
        firstName: 'Emma',
        lastName: 'Bernard',
        present: 5,
        late: 2,
        absent: 4,
        excused: 0,
        denominator: 11,
        rate: 63.64,
      },
    ],
  }
}

/**
 * Mock async simulant l'appel réseau
 */
export async function mockGetTeacherAttendanceOverviewAction(
  userId: string = 'user_1',
  orgId: string = 'org_1'
): Promise<GetTeacherAttendanceOverviewDto> {
  // Optionnel : simuler un délai réseau
  // await new Promise((resolve) => setTimeout(resolve, 300))
  return mockGetTeacherAttendanceOverview()
}
// src/data/mocks/mock.attendance.ts
import { AttendanceStatus } from "@/generated/prisma/browser";
import type { GetScheduleAttendancesDto } from "@/services/attendance";

type AttendanceItem = GetScheduleAttendancesDto[number];
type StatusValue = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

/* -------------------------------------------------------------------------- */
/*  Données sources                                                           */
/* -------------------------------------------------------------------------- */

const FIRST_NAMES = [
  "Lucas", "Emma", "Youssef", "Chloé", "Koffi", "Kossi", "Ama", "Afi",
  "Yao", "Kodjo", "Mawuli", "Sena", "Edem", "Akouvi", "Komlan", "Esso",
  "Inès", "Hugo", "Léa", "Nathan", "Sarah", "Amine", "Fatou", "Moussa",
];

const LAST_NAMES = [
  "Moreau", "Laurent", "Benali", "Bernard", "Agbodjan", "Mensah", "Amegah",
  "Tchalla", "Dossou", "Adjovi", "Gnassingbé", "Lawson", "Kpodar", "Ayivi",
  "Martin", "Dubois", "Petit", "Diallo", "Traoré", "Sow",
];

/** Poids relatifs : plus de PENDING pour bien tester la liste d'attente. */
const STATUS_WEIGHTS: ReadonlyArray<readonly [StatusValue, number]> = [
  [AttendanceStatus.PENDING, 40],
  [AttendanceStatus.PRESENT, 35],
  [AttendanceStatus.LATE, 10],
  [AttendanceStatus.ABSENT, 8],
  [AttendanceStatus.EXCUSED, 7],
];

/* -------------------------------------------------------------------------- */
/*  PRNG déterministe (évite les erreurs d'hydratation et les mocks qui       */
/*  changent à chaque rendu)                                                  */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/*  Générateur                                                                */
/* -------------------------------------------------------------------------- */

export interface GenerateScheduleAttendancesOptions {
  /** Nombre d'élèves à générer (défaut : 30) */
  count?: number;
  /** Graine pour obtenir toujours le même résultat (défaut : 42) */
  seed?: number;
  /** Date de référence pour `recordedAt` (défaut : maintenant) */
  baseDate?: Date;
  /** Force un statut unique pour tous les éléments (utile pour tester un variant) */
  forceStatus?: StatusValue;
}

export function generateScheduleAttendances({
  count = 30,
  seed = 42,
  baseDate = new Date(),
  forceStatus,
}: GenerateScheduleAttendancesOptions = {}): GetScheduleAttendancesDto {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

  const totalWeight = STATUS_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  const pickStatus = (): StatusValue => {
    let r = rand() * totalWeight;
    for (const [status, weight] of STATUS_WEIGHTS) {
      if ((r -= weight) < 0) return status;
    }
    return AttendanceStatus.PENDING;
  };

  return Array.from({ length: count }, (_, i): AttendanceItem => {
    const n = String(i + 1).padStart(2, "0");
    const firstName = rand() < 0.1 ? null : pick(FIRST_NAMES); // ~10 % sans prénom
    const lastName = pick(LAST_NAMES);
    const hasAvatar = rand() < 0.6;
    const minutesAgo = Math.floor(rand() * 90); // 0 à 90 min

    return {
      id: `att-${n}`,
      status: forceStatus ?? pickStatus(),
      recordedAt: new Date(baseDate.getTime() - minutesAgo * 60_000 - Math.floor(rand() * 60) * 1000),
      student: {
        user: {
          id: `usr-stu-${n}`,
          avatar_url: hasAvatar
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                `${firstName ?? ""}${lastName}${n}`
              )}`
            : null,
          firstName,
          lastName,
        },
      },
    };
  }).sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

/** Mock par défaut : 30 présences variées */
export const mockGetScheduleAttendances: GetScheduleAttendancesDto =
  generateScheduleAttendances({ count: 30 });

/** Variantes pratiques pour tester l'UI */
export const mockPendingAttendances = generateScheduleAttendances({
  count: 12,
  seed: 7,
  forceStatus: AttendanceStatus.PENDING,
});

export const mockConfirmedAttendances = generateScheduleAttendances({
  count: 12,
  seed: 11,
  forceStatus: AttendanceStatus.PRESENT,
});