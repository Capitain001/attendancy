import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationEvent, Resource } from "@/generated/prisma/browser";

const mocks = vi.hoisted(() => ({
  claimScheduleAnnouncement: vi.fn(),
  getExpectedAttendees: vi.fn(),
  getParentUserIds: vi.fn(),
  getOrgParentalNotifications: vi.fn(),
  getScheduleForNotify: vi.fn(),
  sendPushNotificationById: vi.fn(),
}));

vi.mock("../database", () => ({
  claimScheduleAnnouncement: mocks.claimScheduleAnnouncement,
  getScheduleForNotify: mocks.getScheduleForNotify,
}));
vi.mock("@/services/schedule/server", () => ({
  claimScheduleAnnouncement: mocks.claimScheduleAnnouncement,
  getScheduleForNotify: mocks.getScheduleForNotify,
}));
vi.mock("@/services/attendance/server", () => ({
  getExpectedAttendees: mocks.getExpectedAttendees,
}));
vi.mock("@/services/organization/server", () => ({
  getOrgParentalNotifications: mocks.getOrgParentalNotifications,
}));
vi.mock("@/services/parent/server", () => ({
  getParentUserIds: mocks.getParentUserIds,
}));
vi.mock("@/services/notification/user", () => ({
  sendPushNotificationToUserById: mocks.sendPushNotificationById,
}));
vi.mock("@/modules/notification/action", () => ({
  sendPushNotificationById: mocks.sendPushNotificationById,
}));

import { notifyScheduleStakeholders } from "../notifications";

const schedule = (
  confirmed: boolean,
  teacherUserId: string | null = "teacher-new",
  teacherId = "teacher-new-id",
) => ({
  teacherId,
  confirmed,
  startTime: new Date("2026-11-12T09:00:00.000Z"),
  course: { name: "Mathématiques" },
  teacher: { userId: teacherUserId },
});

describe("notifyScheduleStakeholders", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getScheduleForNotify.mockResolvedValue(schedule(false));
    mocks.claimScheduleAnnouncement.mockResolvedValue(true);
    mocks.getExpectedAttendees.mockResolvedValue([
      { studentId: "student-1", userId: "student-user-1" },
    ]);
    mocks.getOrgParentalNotifications.mockResolvedValue({
      parentalNotifications: true,
    });
    mocks.getParentUserIds.mockResolvedValue(["parent-user-1"]);
    mocks.sendPushNotificationById.mockResolvedValue({ success: true });
  });

  it("notifies only the teacher for an unconfirmed creation, then claims a confirmation once", async () => {
    const creation = await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CREATED",
    });

    expect(creation).toEqual({ announced: false });
    expect(mocks.claimScheduleAnnouncement).not.toHaveBeenCalled();
    expect(mocks.sendPushNotificationById).toHaveBeenCalledTimes(1);
    expect(mocks.sendPushNotificationById).toHaveBeenCalledWith(
      "teacher-new",
      expect.objectContaining({
        resourceType: Resource.SCHEDULE,
        resourceId: "schedule-1",
        event: NotificationEvent.CREATED,
      }),
    );

    vi.clearAllMocks();
    mocks.getScheduleForNotify.mockResolvedValue(schedule(true));
    mocks.claimScheduleAnnouncement.mockResolvedValueOnce(true);

    const confirmation = await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CONFIRMED",
      before: {
        teacherId: "teacher-new-id",
        confirmed: false,
        status: "PENDING",
        teacherUserId: "teacher-new",
      },
    });

    expect(confirmation).toEqual({ announced: true });
    expect(mocks.sendPushNotificationById).toHaveBeenCalledTimes(2);
    expect(mocks.sendPushNotificationById).not.toHaveBeenCalledWith(
      "teacher-new",
      expect.anything(),
    );

    vi.clearAllMocks();
    mocks.getScheduleForNotify.mockResolvedValue(schedule(true));
    mocks.claimScheduleAnnouncement.mockResolvedValueOnce(false);

    const reconfirmation = await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CONFIRMED",
      before: {
        teacherId: "teacher-new-id",
        confirmed: false,
        status: "PENDING",
        teacherUserId: "teacher-new",
      },
    });

    expect(reconfirmation).toEqual({ announced: false });
    expect(mocks.sendPushNotificationById).not.toHaveBeenCalled();
  });

  it("claims a confirmed creation once, while a later manual announcement skips its audience", async () => {
    mocks.getScheduleForNotify.mockResolvedValue(schedule(true));
    mocks.claimScheduleAnnouncement
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const automatic = await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CREATED",
    });
    expect(automatic).toEqual({ announced: true });
    expect(mocks.sendPushNotificationById).toHaveBeenCalledTimes(3);

    vi.clearAllMocks();
    mocks.getScheduleForNotify.mockResolvedValue(schedule(true));
    mocks.claimScheduleAnnouncement.mockResolvedValueOnce(false);

    const manual = await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CREATED",
      audience: "STUDENTS_AND_PARENTS",
    });

    expect(manual).toEqual({ announced: false });
    expect(mocks.sendPushNotificationById).not.toHaveBeenCalled();
  });

  it("still notifies the teacher when a confirmed creation claim is refused", async () => {
    mocks.getScheduleForNotify.mockResolvedValue(schedule(true));
    mocks.claimScheduleAnnouncement.mockResolvedValueOnce(false);

    const result = await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CREATED",
    });

    expect(result).toEqual({ announced: false });
    expect(mocks.sendPushNotificationById).toHaveBeenCalledTimes(1);
    expect(mocks.sendPushNotificationById).toHaveBeenCalledWith(
      "teacher-new",
      expect.objectContaining({
        resourceType: Resource.SCHEDULE,
        resourceId: "schedule-1",
        event: NotificationEvent.CREATED,
      }),
    );
    expect(mocks.getExpectedAttendees).not.toHaveBeenCalled();
  });

  it("announces a recurrence whose null state is accepted by the claim", async () => {
    mocks.getScheduleForNotify.mockResolvedValue(schedule(true));
    mocks.claimScheduleAnnouncement.mockResolvedValueOnce(true);

    await expect(
      notifyScheduleStakeholders({
        scheduleId: "recurring-schedule",
        orgId: "org-1",
        event: "CONFIRMED",
        before: {
          teacherId: "teacher-new-id",
          confirmed: false,
          status: "PENDING",
          teacherUserId: "teacher-new",
        },
      }),
    ).resolves.toEqual({ announced: true });
    expect(mocks.claimScheduleAnnouncement).toHaveBeenCalledWith(
      "recurring-schedule",
      "org-1",
    );
    expect(mocks.sendPushNotificationById).toHaveBeenCalledTimes(2);
  });

  it("does not resend cancellation when the snapshot is already canceled", async () => {
    await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CANCELED",
      before: {
        teacherId: "teacher-new-id",
        confirmed: true,
        status: "PENDING",
        teacherUserId: "teacher-new",
      },
    });
    expect(mocks.sendPushNotificationById).toHaveBeenCalledTimes(3);

    vi.resetAllMocks();

    const result = await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CANCELED",
      before: {
        confirmed: true,
        status: "CANCELED",
        teacherUserId: "teacher-new",
      },
    });

    expect(result).toEqual({ announced: false });
    expect(mocks.getScheduleForNotify).not.toHaveBeenCalled();
    expect(mocks.sendPushNotificationById).not.toHaveBeenCalled();
  });

  it("sends a reassignment notice to the old and new teachers on confirmation", async () => {
    mocks.getScheduleForNotify.mockResolvedValue(schedule(true, "teacher-new"));

    await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CONFIRMED",
      before: {
        teacherId: "teacher-old-id",
        confirmed: false,
        status: "PENDING",
        teacherUserId: "teacher-old",
      },
    });

    expect(mocks.sendPushNotificationById).toHaveBeenCalledWith(
      "teacher-old",
      expect.objectContaining({
        resourceType: Resource.SCHEDULE,
        resourceId: "schedule-1",
        event: NotificationEvent.UNASSIGNED,
        message: expect.stringContaining("ne vous est plus assigné"),
      }),
    );
    expect(mocks.sendPushNotificationById).toHaveBeenCalledWith(
      "teacher-new",
      expect.objectContaining({
        resourceType: Resource.SCHEDULE,
        resourceId: "schedule-1",
        event: NotificationEvent.CREATED,
        message: expect.stringContaining("Vous êtes affecté"),
      }),
    );
    expect(mocks.sendPushNotificationById).toHaveBeenCalledWith(
      "student-user-1",
      expect.objectContaining({
        resourceType: Resource.SCHEDULE,
        resourceId: "schedule-1",
        event: NotificationEvent.CONFIRMED,
      }),
    );
  });

  it("detects teacher reassignment by comparing teacherId before and after", async () => {
    mocks.getScheduleForNotify.mockResolvedValue(
      schedule(true, "teacher-new", "teacher-new-id"),
    );

    await notifyScheduleStakeholders({
      scheduleId: "schedule-1",
      orgId: "org-1",
      event: "CONFIRMED",
      before: {
        teacherId: "teacher-old-id",
        confirmed: false,
        status: "PENDING",
        teacherUserId: "teacher-old",
      },
    });

    expect(mocks.sendPushNotificationById).toHaveBeenCalledTimes(4);
    expect(mocks.sendPushNotificationById).toHaveBeenCalledWith(
      "teacher-old",
      expect.objectContaining({
        resourceType: Resource.SCHEDULE,
        resourceId: "schedule-1",
        event: NotificationEvent.UNASSIGNED,
        message: expect.stringContaining("ne vous est plus assigné"),
      }),
    );
    expect(mocks.sendPushNotificationById).toHaveBeenCalledWith(
      "teacher-new",
      expect.objectContaining({
        resourceType: Resource.SCHEDULE,
        resourceId: "schedule-1",
        event: NotificationEvent.CREATED,
      }),
    );
  });
});
