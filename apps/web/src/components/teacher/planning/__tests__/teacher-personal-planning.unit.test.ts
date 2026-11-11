// src/components/teacher/planning/__tests__/teacher-personal-planning.unit.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setHours } from "date-fns/setHours";
import { startOfDay } from "date-fns/startOfDay";

const {
  roomFindFirstMock,
  roomUpsertMock,
  academicYearUpsertMock,
  departmentUpsertMock,
  programTrackUpsertMock,
  classCreateMock,
  transactionMock,
  invalidateEventMock,
  authAccessMock,
  getSchedulesDbMock,
} = vi.hoisted(() => ({
  roomFindFirstMock: vi.fn(),
  roomUpsertMock: vi.fn(),
  academicYearUpsertMock: vi.fn(),
  departmentUpsertMock: vi.fn(),
  programTrackUpsertMock: vi.fn(),
  classCreateMock: vi.fn(),
  transactionMock: vi.fn(),
  invalidateEventMock: vi.fn(),
  authAccessMock: vi.fn(),
  getSchedulesDbMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));

vi.mock("@/modules/user", () => ({
  getUserInfo: vi.fn(),
}));

vi.mock("@/modules/audit", () => ({
  auditLog: vi.fn(),
}));

vi.mock("@/services/notification", () => ({
  notifyScheduleCreated: vi.fn(),
  notifyScheduleUpdated: vi.fn(),
  notifyScheduleCanceled: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("@/cache/server/graph", () => ({
  invalidateEvent: invalidateEventMock,
}));

vi.mock("@/services/auth", () => ({
  authAccess: authAccessMock,
}));

vi.mock("@/modules/auth", () => ({
  authAccess: authAccessMock,
}));

vi.mock("@/components/planning/hook/usePlanningEvents", () => ({
  usePlanningEvents: vi.fn(),
}));

vi.mock("@/hooks/data/planning/useAvailability", () => ({
  useAvailability: vi.fn(),
}));

vi.mock("@/services/planning/queries", () => ({
  planningSchedulesQuery: vi.fn(),
}));

vi.mock("@/services/course/database", () => ({
  getCourses: vi.fn(),
}));

vi.mock("@/services/room/database", () => ({
  getRooms: vi.fn(),
}));

vi.mock("@/services/schedule/database", () => ({
  getSchedules: getSchedulesDbMock,
  getSchedulesByClass: vi.fn(),
  getScheduleDays: vi.fn(),
  getSchedulesByCourse: vi.fn(),
  getDaySchedules: vi.fn(),
  getTeacherNextSchedule: vi.fn(),
  getTodayClassSchedules: vi.fn(),
  getTeacherSchedules: vi.fn(),
  getTeacherSchedulesInfo: vi.fn(),
  getCourseLastSchedule: vi.fn(),
  getTeacherDailySchedule: vi.fn(),
}));

import { PERSONAL } from "@/features/personal/constants";
import {
  createPersonalClass,
  ensurePersonalRoom,
} from "@/features/personal/services/class/database/class.mutations";
import { getAuthorization } from "@/modules/auth/persmission/autorization";
import { getSchedulesAction } from "@/services/schedule/actions/schedule.queries";
import type { PlanningResources } from "@/services/planning";
import { NO_GROUP, NO_TEACHER } from "@/components/planning/types";
import { buildDraftEvent } from "../TeacherPersonalPlanning";
import {
  formatDurationMinutes,
  resolveTeacherDialogDefaultForm,
} from "../utils";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CLASS_ID = "22222222-2222-4222-8222-222222222222";
const TEACHER_ID = "33333333-3333-4333-8333-333333333333";
const COURSE_1_ID = "44444444-4444-4444-8444-444444444444";
const COURSE_2_ID = "55555555-5555-4555-8555-555555555555";
const ROOM_1_ID = "66666666-6666-4666-8666-666666666666";
const ROOM_2_ID = "77777777-7777-4777-8777-777777777777";
const GROUP_1_ID = "88888888-8888-4888-8888-888888888888";

function makeResources(overrides?: Partial<NonNullable<PlanningResources>>): NonNullable<PlanningResources> {
  return {
    class: { id: CLASS_ID, name: "Terminale S1" },
    rooms: [{ id: ROOM_1_ID, name: PERSONAL.ROOM_NAME }],
    groups: [],
    courses: [
      {
        id: COURSE_1_ID,
        name: "Mathématiques",
        teachers: [
          {
            id: TEACHER_ID,
            name: "Jean Dupont",
            email: "jean@example.com",
            avatar_url: null,
            isMain: true,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("ensurePersonalRoom & createPersonalClass (salle par défaut en org PERSONAL)", () => {
  const fakeTx = {
    room: {
      findFirst: roomFindFirstMock,
      upsert: roomUpsertMock,
    },
    academicYear: { upsert: academicYearUpsertMock },
    department: { upsert: departmentUpsertMock },
    programTrack: { upsert: programTrackUpsertMock },
    class: { create: classCreateMock },
  } as unknown as Parameters<typeof ensurePersonalRoom>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    academicYearUpsertMock.mockResolvedValue({ id: "ay-1" });
    departmentUpsertMock.mockResolvedValue({ id: "dept-1" });
    programTrackUpsertMock.mockResolvedValue({ id: "pt-1" });
    classCreateMock.mockResolvedValue({ id: CLASS_ID });
    roomUpsertMock.mockResolvedValue({ id: ROOM_1_ID });
    invalidateEventMock.mockResolvedValue(undefined);
    transactionMock.mockImplementation(async (cb: (tx: typeof fakeTx) => unknown) => cb(fakeTx));
  });

  it("ne crée rien et retourne false si une salle active (deletedAt: null) existe déjà", async () => {
    roomFindFirstMock.mockResolvedValue({ id: ROOM_1_ID });

    const created = await ensurePersonalRoom(fakeTx, ORG_ID);

    expect(created).toBe(false);
    expect(roomFindFirstMock).toHaveBeenCalledWith({
      where: { orgId: ORG_ID, deletedAt: null },
      select: { id: true },
    });
    expect(roomUpsertMock).not.toHaveBeenCalled();
  });

  it("effectue un upsert de PERSONAL.ROOM_NAME (réactivant une éventuelle salle soft-deletée) si aucune salle active n'existe", async () => {
    roomFindFirstMock.mockResolvedValue(null);

    const created = await ensurePersonalRoom(fakeTx, ORG_ID);

    expect(created).toBe(true);
    expect(roomUpsertMock).toHaveBeenCalledWith({
      where: { name_orgId: { name: PERSONAL.ROOM_NAME, orgId: ORG_ID } },
      update: { deletedAt: null },
      create: { name: PERSONAL.ROOM_NAME, orgId: ORG_ID },
      select: { id: true },
    });
  });

  it("createPersonalClass appelle ensurePersonalRoom dans la transaction et invalide ROOM_CREATED après commit", async () => {
    roomFindFirstMock.mockResolvedValue(null);

    const res = await createPersonalClass({
      orgId: ORG_ID,
      name: "Masterclass React",
      type: "THEMATIC",
    });

    expect(res).toEqual({ id: CLASS_ID });
    expect(roomUpsertMock).toHaveBeenCalledTimes(1);
    expect(invalidateEventMock).toHaveBeenCalledWith("ROOM_CREATED", ORG_ID);
    expect(invalidateEventMock).toHaveBeenCalledWith("CLASS_CREATED", ORG_ID);
  });
});

describe("Autorisation planning en org PERSONAL (getAuthorization & getSchedulesAction)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("autorise un TEACHER d'org PERSONAL sur les actions exigeant DIRECTION + PRINCIPAL/SECRETARY quand allowPersonalOrg=true", () => {
    const personalTeacher = {
      role: "TEACHER" as const,
      function: undefined,
      organization: { id: ORG_ID, type: "PERSONAL" as const },
    };

    expect(
      getAuthorization(personalTeacher, "DIRECTION", "PRINCIPAL", {
        allowPersonalOrg: true,
      })
    ).toEqual({ error: null });

    expect(
      getAuthorization(personalTeacher, "DIRECTION", ["PRINCIPAL", "SECRETARY"], {
        allowPersonalOrg: true,
      })
    ).toEqual({ error: null });
  });

  it("refuse un TEACHER d'org INSTITUTION ou sans allowPersonalOrg sur une action DIRECTION", () => {
    const institutionTeacher = {
      role: "TEACHER" as const,
      organization: { id: ORG_ID, type: "INSTITUTION" as const },
    };

    expect(
      getAuthorization(institutionTeacher, "DIRECTION", undefined, {
        allowPersonalOrg: true,
      }).error
    ).toContain("insuffisant");
  });

  it("getSchedulesAction passe allowPersonalOrg: true à authAccess et filtre avec l'orgId du token", async () => {
    authAccessMock.mockResolvedValue({
      data: { orgId: ORG_ID, user: { id: "u-1", role: "TEACHER" } },
    });
    getSchedulesDbMock.mockResolvedValue([]);

    const rangeStart = new Date("2026-11-01T00:00:00.000Z");
    const rangeEnd = new Date("2026-11-30T23:59:59.999Z");

    const res = await getSchedulesAction({
      classId: CLASS_ID,
      rangeStart,
      rangeEnd,
    });

    expect(authAccessMock).toHaveBeenCalledWith({
      requiredRole: "DIRECTION",
      allowPersonalOrg: true,
    });
    expect(getSchedulesDbMock).toHaveBeenCalledWith({
      orgId: ORG_ID,
      classId: CLASS_ID,
      rangeStart,
      rangeEnd,
    });
    expect(res).toEqual({ data: [] });
  });
});

describe("buildDraftEvent (brouillon de création de séance)", () => {
  const now = new Date(2026, 10, 9, 10, 30, 0); // 9 nov 2026 à 10h30

  it("retourne null si le jour sélectionné est dans le passé", () => {
    const yesterday = new Date(2026, 10, 8, 12, 0, 0);
    const draft = buildDraftEvent(yesterday, CLASS_ID, TEACHER_ID, makeResources(), now);
    expect(draft).toBeNull();
  });

  it("retourne null aujourd'hui si l'heure courante dépasse la fin de grille (EndHour)", () => {
    const lateTonight = new Date(2026, 10, 9, 23, 15, 0);
    const draft = buildDraftEvent(lateTonight, CLASS_ID, TEACHER_ID, makeResources(), lateTonight);
    expect(draft).toBeNull();
  });

  it("positionne le créneau à now.getHours() + 1 aujourd'hui et auto-sélectionne cours + salle uniques", () => {
    const today = startOfDay(now);
    const draft = buildDraftEvent(today, CLASS_ID, TEACHER_ID, makeResources(), now);

    expect(draft).not.toBeNull();
    expect(draft?.id).toBe("");
    expect(draft?.start).toEqual(setHours(today, 11));
    expect(draft?.end).toEqual(setHours(today, 12));
    expect(draft?.meta).toEqual({
      classId: CLASS_ID,
      courseId: COURSE_1_ID,
      teacherId: TEACHER_ID,
      roomId: ROOM_1_ID,
      groupId: undefined,
      status: "PENDING",
      confirmed: false,
      isLocked: false,
    });
  });

  it("laisse courseId vide et roomId undefined sur un jour futur quand plusieurs cours et salles existent", () => {
    const tomorrow = new Date(2026, 10, 10, 0, 0, 0);
    const multiResources = makeResources({
      rooms: [
        { id: ROOM_1_ID, name: "Salle 1" },
        { id: ROOM_2_ID, name: "Salle 2" },
      ],
      courses: [
        { id: COURSE_1_ID, name: "Maths", teachers: [] },
        { id: COURSE_2_ID, name: "Physique", teachers: [] },
      ],
    });

    const draft = buildDraftEvent(tomorrow, CLASS_ID, TEACHER_ID, multiResources, now);

    expect(draft?.start.getHours()).toBe(9); // DefaultStartHour = 9
    expect(draft?.end.getHours()).toBe(10);
    expect(draft?.meta.courseId).toBe("");
    expect(draft?.meta.roomId).toBeUndefined();
    expect(draft?.meta.teacherId).toBe(TEACHER_ID);
  });
});

describe("resolveTeacherDialogDefaultForm & formatDurationMinutes (TeacherPlanningDialog)", () => {
  it("auto-sélectionne le cours unique, la salle par défaut et le teacherId en création", () => {
    const form = resolveTeacherDialogDefaultForm({
      event: null,
      resources: makeResources(),
      teacherId: undefined, // doit retomber sur l'enseignant du cours
    });

    expect(form.courseId).toBe(COURSE_1_ID);
    expect(form.roomId).toBe(ROOM_1_ID);
    expect(form.teacherId).toBe(TEACHER_ID);
    expect(form.groupId).toBe(NO_GROUP);
    expect(form.status).toBe("PENDING");
  });

  it("conserve les valeurs d'une séance existante en mode édition", () => {
    const start = new Date(2026, 10, 12, 14, 15, 0);
    const end = new Date(2026, 10, 12, 16, 0, 0);

    const form = resolveTeacherDialogDefaultForm({
      event: {
        id: "sched-1",
        title: "Physique",
        description: "Apporter calculatrice",
        start,
        end,
        meta: {
          classId: CLASS_ID,
          courseId: COURSE_2_ID,
          teacherId: TEACHER_ID,
          roomId: ROOM_2_ID,
          groupId: GROUP_1_ID,
          status: "PENDING",
          confirmed: true,
        },
      },
      resources: makeResources(),
      teacherId: TEACHER_ID,
    });

    expect(form.courseId).toBe(COURSE_2_ID);
    expect(form.roomId).toBe(ROOM_2_ID);
    expect(form.teacherId).toBe(TEACHER_ID);
    expect(form.groupId).toBe(GROUP_1_ID);
    expect(form.notes).toBe("Apporter calculatrice");
    expect(form.startTime).toBe("14:15");
    expect(form.endTime).toBe("16:00");
    expect(form.confirmed).toBe(true);
  });

  it("formate correctement la durée en heures et minutes", () => {
    expect(formatDurationMinutes(0)).toBe("");
    expect(formatDurationMinutes(45)).toBe("45 min");
    expect(formatDurationMinutes(60)).toBe("1h");
    expect(formatDurationMinutes(90)).toBe("1h30");
    expect(formatDurationMinutes(125)).toBe("2h05");
  });

  it("retourne NO_TEACHER uniquement si aucun teacherId ni enseignant de cours n'est disponible", () => {
    const emptyTeachersResources = makeResources({
      courses: [{ id: COURSE_1_ID, name: "Maths", teachers: [] }],
    });

    const form = resolveTeacherDialogDefaultForm({
      event: null,
      resources: emptyTeachersResources,
      teacherId: undefined,
    });

    expect(form.teacherId).toBe(NO_TEACHER);
  });
});
