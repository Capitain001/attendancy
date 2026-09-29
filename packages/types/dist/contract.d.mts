import { Jsonify } from 'type-fest';
import * as runtime from '@prisma/client/runtime/client';

declare const Level: {
    readonly L1: "L1";
    readonly L2: "L2";
    readonly L3: "L3";
    readonly M1: "M1";
    readonly M2: "M2";
    readonly D1: "D1";
    readonly D2: "D2";
    readonly D3: "D3";
};
type Level = (typeof Level)[keyof typeof Level];
declare const UEType: {
    readonly FONDAMENTALE: "FONDAMENTALE";
    readonly COMPLEMENTAIRE: "COMPLEMENTAIRE";
    readonly APPROFONDISSEMENT: "APPROFONDISSEMENT";
    readonly SPECIALITE: "SPECIALITE";
    readonly TRANSVERSALE: "TRANSVERSALE";
    readonly LIBRE: "LIBRE";
};
type UEType = (typeof UEType)[keyof typeof UEType];
declare const JustificationStatus: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly CANCELED: "CANCELED";
};
type JustificationStatus = (typeof JustificationStatus)[keyof typeof JustificationStatus];
declare const SessionStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly CANCELED: "CANCELED";
    readonly COMPLETED: "COMPLETED";
};
type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
declare const VerificationMethod: {
    readonly QR: "QR";
    readonly GPS: "GPS";
    readonly ADMIN_OVERRIDE: "ADMIN_OVERRIDE";
    readonly WIFI: "WIFI";
    readonly FACE_RECOGNITION: "FACE_RECOGNITION";
};
type VerificationMethod = (typeof VerificationMethod)[keyof typeof VerificationMethod];
declare const AttendanceStatus: {
    readonly PRESENT: "PRESENT";
    readonly ABSENT: "ABSENT";
    readonly LATE: "LATE";
    readonly EXCUSED: "EXCUSED";
    readonly PENDING: "PENDING";
};
type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];
declare const SubscriptionStatus: {
    readonly TRIALING: "TRIALING";
    readonly ACTIVE: "ACTIVE";
    readonly PAST_DUE: "PAST_DUE";
    readonly CANCELED: "CANCELED";
    readonly EXPIRED: "EXPIRED";
};
type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
declare const ChannelType: {
    readonly CLASS: "CLASS";
    readonly GROUP: "GROUP";
    readonly ORG: "ORG";
    readonly DM: "DM";
};
type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];
declare const ParticipantRole: {
    readonly OWNER: "OWNER";
    readonly MEMBER: "MEMBER";
};
type ParticipantRole = (typeof ParticipantRole)[keyof typeof ParticipantRole];
declare const NotificationType: {
    readonly ABSENCE: "ABSENCE";
    readonly COURSE_CHANGE: "COURSE_CHANGE";
    readonly NEW_COURSE: "NEW_COURSE";
    readonly SCHEDULE_UPDATE: "SCHEDULE_UPDATE";
    readonly GENERAL: "GENERAL";
    readonly MESSAGE: "MESSAGE";
    readonly INVITATION: "INVITATION";
};
type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
declare const DeviceType: {
    readonly DESKTOP: "DESKTOP";
    readonly MOBILE: "MOBILE";
    readonly TABLET: "TABLET";
    readonly UNKNOWN: "UNKNOWN";
};
type DeviceType = (typeof DeviceType)[keyof typeof DeviceType];
declare const UserSessionStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly EXPIRED: "EXPIRED";
    readonly REVOKED: "REVOKED";
};
type UserSessionStatus = (typeof UserSessionStatus)[keyof typeof UserSessionStatus];
declare const SessionRevokeReason: {
    readonly USER_LOGOUT: "USER_LOGOUT";
    readonly USER_REVOKED_DEVICE: "USER_REVOKED_DEVICE";
    readonly ADMIN_REVOKED: "ADMIN_REVOKED";
    readonly PASSWORD_CHANGE: "PASSWORD_CHANGE";
};
type SessionRevokeReason = (typeof SessionRevokeReason)[keyof typeof SessionRevokeReason];
declare const GradeStatus: {
    readonly GRADED: "GRADED";
    readonly ABSENT: "ABSENT";
    readonly EXCUSED: "EXCUSED";
    readonly PENDING: "PENDING";
};
type GradeStatus = (typeof GradeStatus)[keyof typeof GradeStatus];
declare const EvaluationType: {
    readonly DEVOIR: "DEVOIR";
    readonly EXAMEN: "EXAMEN";
    readonly PARTICIPATION: "PARTICIPATION";
    readonly PROJET: "PROJET";
};
type EvaluationType = (typeof EvaluationType)[keyof typeof EvaluationType];
declare const UnavailabilityType: {
    readonly WEEKLY: "WEEKLY";
    readonly DATE_RANGE: "DATE_RANGE";
};
type UnavailabilityType = (typeof UnavailabilityType)[keyof typeof UnavailabilityType];
declare const ScheduleStatus: {
    readonly PENDING: "PENDING";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELED: "CANCELED";
    readonly MISSED: "MISSED";
};
type ScheduleStatus = (typeof ScheduleStatus)[keyof typeof ScheduleStatus];
declare const ScheduleNotifyState: {
    readonly PENDING: "PENDING";
    readonly SENT: "SENT";
};
type ScheduleNotifyState = (typeof ScheduleNotifyState)[keyof typeof ScheduleNotifyState];
declare const EventType: {
    readonly MEETING: "MEETING";
    readonly EXAM: "EXAM";
    readonly COURSE: "COURSE";
    readonly GENERAL: "GENERAL";
    readonly ADMINISTRATIVE: "ADMINISTRATIVE";
};
type EventType = (typeof EventType)[keyof typeof EventType];
declare const EventStatus: {
    readonly PENDING: "PENDING";
    readonly ACCEPTED: "ACCEPTED";
    readonly DECLINED: "DECLINED";
};
type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
declare const ScheduleType: {
    readonly CM: "CM";
    readonly TD: "TD";
    readonly TP: "TP";
    readonly EXAM: "EXAM";
    readonly RATTRAPAGE: "RATTRAPAGE";
};
type ScheduleType = (typeof ScheduleType)[keyof typeof ScheduleType];
declare const ApprovalStatus: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly CANCELED: "CANCELED";
};
type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];
declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly ON_LEAVE: "ON_LEAVE";
    readonly PENDING: "PENDING";
};
type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
declare const Role: {
    readonly ADMIN: "ADMIN";
    readonly TEACHER: "TEACHER";
    readonly STUDENT: "STUDENT";
    readonly PARENT: "PARENT";
    readonly DIRECTION: "DIRECTION";
};
type Role = (typeof Role)[keyof typeof Role];
declare const Action: {
    readonly CREATE: "CREATE";
    readonly READ: "READ";
    readonly UPDATE: "UPDATE";
    readonly DELETE: "DELETE";
    readonly CRUD: "CRUD";
};
type Action = (typeof Action)[keyof typeof Action];
declare const Resource: {
    readonly COURSE: "COURSE";
    readonly SCHEDULE: "SCHEDULE";
    readonly USER: "USER";
    readonly STUDENT: "STUDENT";
    readonly TEACHER: "TEACHER";
    readonly ROOM: "ROOM";
    readonly LOCATION: "LOCATION";
    readonly PROGRAM: "PROGRAM";
    readonly FILIERE: "FILIERE";
    readonly ATTENDANCE: "ATTENDANCE";
    readonly GRADE: "GRADE";
    readonly CLASS: "CLASS";
    readonly MESSAGE: "MESSAGE";
    readonly JUSTIFICATION: "JUSTIFICATION";
};
type Resource = (typeof Resource)[keyof typeof Resource];
declare const InvitationType: {
    readonly DIRECT_CREATE: "DIRECT_CREATE";
    readonly INVITE_ONLY: "INVITE_ONLY";
};
type InvitationType = (typeof InvitationType)[keyof typeof InvitationType];
declare const OrganizationType: {
    readonly INSTITUTION: "INSTITUTION";
    readonly PERSONAL: "PERSONAL";
};
type OrganizationType = (typeof OrganizationType)[keyof typeof OrganizationType];
declare const Sex: {
    readonly MALE: "MALE";
    readonly FEMALE: "FEMALE";
    readonly OTHER: "OTHER";
};
type Sex = (typeof Sex)[keyof typeof Sex];
declare const DocumentType: {
    readonly GENERAL: "GENERAL";
    readonly ACADEMIC: "ACADEMIC";
    readonly PROFILE: "PROFILE";
    readonly PEDAGOGY: "PEDAGOGY";
    readonly JUSTIFICATION: "JUSTIFICATION";
    readonly MEDICAL: "MEDICAL";
    readonly DISCIPLINE: "DISCIPLINE";
};
type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

type $AcademicYearPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AcademicYear";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        classes: $ClassPayload<ExtArgs>[];
        optionalUEs: $OptionalUEPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        orgId: string;
        isActive: boolean;
        isCurrent: boolean;
    }, ExtArgs["result"]["academicYear"]>;
    composites: {};
};

type $DepartmentPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Department";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        programTracks: $ProgramTrackPayload<ExtArgs>[];
        teachers: $TeacherPayload<ExtArgs>[];
        ues: $UEPayload<ExtArgs>[];
        userOrganizations: $UserOrganizationPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        orgId: string;
    }, ExtArgs["result"]["department"]>;
    composites: {};
};

type $ProgramTrackPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ProgramTrack";
    objects: {
        classes: $ClassPayload<ExtArgs>[];
        programs: $ProgramPayload<ExtArgs>[];
        department: $DepartmentPayload<ExtArgs>;
        organization: $OrganizationPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        description: string | null;
        orgId: string;
        departmentId: string;
    }, ExtArgs["result"]["programTrack"]>;
    composites: {};
};

type $ProgramPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Program";
    objects: {
        classes: $ClassPayload<ExtArgs>[];
        organization: $OrganizationPayload<ExtArgs>;
        programTrack: $ProgramTrackPayload<ExtArgs>;
        programUEs: $ProgramUEPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        description: string | null;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isActive: boolean;
        isLocked: boolean;
        programTrackId: string;
    }, ExtArgs["result"]["program"]>;
    composites: {};
};

type $ProgramUEPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ProgramUE";
    objects: {
        program: $ProgramPayload<ExtArgs>;
        ue: $UEPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        programId: string;
        ueId: string;
        isCompleted: boolean;
        isOptional: boolean;
        semester: number;
        createdAt: Date;
        order: number | null;
        updatedAt: Date;
    }, ExtArgs["result"]["programUE"]>;
    composites: {};
};

type $UEPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UE";
    objects: {
        optionalUEs: $OptionalUEPayload<ExtArgs>[];
        programUEs: $ProgramUEPayload<ExtArgs>[];
        department: $DepartmentPayload<ExtArgs> | null;
        organization: $OrganizationPayload<ExtArgs>;
        ueCourses: $UECoursePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        code: string | null;
        description: string | null;
        imageUrl: string | null;
        departmentId: string | null;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isOptional: boolean;
        type: UEType;
    }, ExtArgs["result"]["uE"]>;
    composites: {};
};

type $UECoursePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UECourse";
    objects: {
        courses: $CoursePayload<ExtArgs>[];
        organization: $OrganizationPayload<ExtArgs>;
        ue: $UEPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        description: string | null;
        credits: number;
        imageUrl: string | null;
        duration: number;
        settings: runtime.JsonValue | null;
        orgId: string;
        ueId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        code: string | null;
        order: number | null;
    }, ExtArgs["result"]["uECourse"]>;
    composites: {};
};

type $ClassPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Class";
    objects: {
        channels: $ChannelPayload<ExtArgs>[];
        academicYear: $AcademicYearPayload<ExtArgs>;
        program: $ProgramPayload<ExtArgs> | null;
        programTrack: $ProgramTrackPayload<ExtArgs>;
        courses: $CoursePayload<ExtArgs>[];
        groups: $GroupPayload<ExtArgs>[];
        schedules: $SchedulePayload<ExtArgs>[];
        studentEnrollments: $StudentEnrollmentPayload<ExtArgs>[];
        terms: $TermPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        programTrackId: string;
        level: Level;
        programId: string | null;
        academicYearId: string;
        isActive: boolean;
    }, ExtArgs["result"]["class"]>;
    composites: {};
};

type $TermPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Term";
    objects: {
        class: $ClassPayload<ExtArgs>;
        courses: $CoursePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        classId: string;
        order: number;
        name: string;
        startDate: Date | null;
        endDate: Date | null;
        lockedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["term"]>;
    composites: {};
};

type $CoursePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Course";
    objects: {
        class: $ClassPayload<ExtArgs>;
        organization: $OrganizationPayload<ExtArgs>;
        term: $TermPayload<ExtArgs> | null;
        ueCourse: $UECoursePayload<ExtArgs>;
        teachers: $CourseTeacherPayload<ExtArgs>[];
        evaluations: $EvaluationPayload<ExtArgs>[];
        schedules: $SchedulePayload<ExtArgs>[];
        weeklySlots: $WeeklySlotPayload<ExtArgs>[];
        teacherHours: $TeacherCourseHoursPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        settings: runtime.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        classId: string;
        durationDone: number;
        durationTotal: number;
        orgId: string;
        name: string;
        credits: number;
        description: string | null;
        ueCourseId: string;
        termId: string | null;
    }, ExtArgs["result"]["course"]>;
    composites: {};
};

type $CourseTeacherPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "CourseTeacher";
    objects: {
        course: $CoursePayload<ExtArgs>;
        teacher: $TeacherPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        teacherId: string | null;
        isMain: boolean;
        courseId: string;
        createdAt: Date;
        updatedAt: Date;
        hours: number | null;
    }, ExtArgs["result"]["courseTeacher"]>;
    composites: {};
};

type $TeacherCourseHoursPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TeacherCourseHours";
    objects: {
        teacher: $TeacherPayload<ExtArgs>;
        course: $CoursePayload<ExtArgs>;
        organization: $OrganizationPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        orgId: string;
        teacherId: string;
        courseId: string;
        scheduleType: ScheduleType;
        completedHours: number;
        updatedAt: Date;
    }, ExtArgs["result"]["teacherCourseHours"]>;
    composites: {};
};

type $OptionalUEPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "OptionalUE";
    objects: {
        student: $StudentPayload<ExtArgs>;
        ue: $UEPayload<ExtArgs>;
        academicYear: $AcademicYearPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        studentId: string;
        yearId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        ueId: string;
    }, ExtArgs["result"]["optionalUE"]>;
    composites: {};
};

type $StudentEnrollmentPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "StudentEnrollment";
    objects: {
        class: $ClassPayload<ExtArgs>;
        student: $StudentPayload<ExtArgs>;
        studentGroups: $StudentGroupPayload<ExtArgs>[];
        attendances: $AttendancePayload<ExtArgs>[];
        grades: $GradePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        studentId: string;
        classId: string;
        createdAt: Date;
        updatedAt: Date;
        endedAt: Date | null;
    }, ExtArgs["result"]["studentEnrollment"]>;
    composites: {};
};

type $GroupPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Group";
    objects: {
        channels: $ChannelPayload<ExtArgs>[];
        class: $ClassPayload<ExtArgs>;
        schedules: $SchedulePayload<ExtArgs>[];
        studentGroups: $StudentGroupPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        classId: string;
    }, ExtArgs["result"]["group"]>;
    composites: {};
};

type $StudentGroupPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "StudentGroup";
    objects: {
        enrollment: $StudentEnrollmentPayload<ExtArgs>;
        group: $GroupPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        enrollmentId: string;
        groupId: string;
        createdAt: Date;
    }, ExtArgs["result"]["studentGroup"]>;
    composites: {};
};

type $SessionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Session";
    objects: {
        qrScans: $QRScanPayload<ExtArgs>[];
        location: $LocationPayload<ExtArgs> | null;
        schedule: $SchedulePayload<ExtArgs>;
        tokens: $SessionTokenPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        scheduleId: string;
        status: SessionStatus;
        isLate: boolean;
        checkIn: Date | null;
        checkOut: Date | null;
        checkInMethod: VerificationMethod | null;
        checkOutMethod: VerificationMethod | null;
        durationMinutes: number | null;
        endedAutomatically: boolean;
        locationId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["session"]>;
    composites: {};
};

type $SessionTokenPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "SessionToken";
    objects: {
        session: $SessionPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        sessionId: string;
        token: string;
        expiresAt: Date;
        createdAt: Date;
    }, ExtArgs["result"]["sessionToken"]>;
    composites: {};
};

type $AttendancePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Attendance";
    objects: {
        schedule: $SchedulePayload<ExtArgs>;
        student: $StudentPayload<ExtArgs>;
        enrollment: $StudentEnrollmentPayload<ExtArgs>;
        organization: $OrganizationPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        scheduleId: string;
        studentId: string;
        enrollmentId: string;
        status: AttendanceStatus;
        recordedAt: Date;
        details: runtime.JsonValue | null;
        notes: string | null;
        orgId: string;
    }, ExtArgs["result"]["attendance"]>;
    composites: {};
};

type $QRCodePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "QRCode";
    objects: {
        room: $RoomPayload<ExtArgs>;
        scanHistory: $QRScanPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        code: string;
        roomId: string;
        expiresAt: Date | null;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["qRCode"]>;
    composites: {};
};

type $QRScanPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "QRScan";
    objects: {
        qrCode: $QRCodePayload<ExtArgs>;
        session: $SessionPayload<ExtArgs> | null;
        user: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        qrCodeId: string;
        userId: string | null;
        sessionId: string | null;
        timestamp: Date;
        ipAddress: string | null;
        userAgent: string | null;
    }, ExtArgs["result"]["qRScan"]>;
    composites: {};
};

type $JustificationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Justification";
    objects: {
        student: $StudentPayload<ExtArgs>;
        organization: $OrganizationPayload<ExtArgs>;
        schedule: $SchedulePayload<ExtArgs>;
        declaredBy: $UserPayload<ExtArgs> | null;
        reviewedBy: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        studentId: string;
        orgId: string;
        scheduleId: string;
        declaredById: string | null;
        reason: string | null;
        status: JustificationStatus;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reviewComment: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["justification"]>;
    composites: {};
};

type $PlanPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Plan";
    objects: {
        subscriptions: $SubscriptionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        code: string;
        name: string;
        priceMonthly: runtime.Decimal | null;
        currency: string;
        features: runtime.JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["plan"]>;
    composites: {};
};

type $SubscriptionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Subscription";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        plan: $PlanPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        orgId: string;
        planId: string;
        status: SubscriptionStatus;
        trialEndsAt: Date | null;
        currentPeriodStart: Date | null;
        currentPeriodEnd: Date | null;
        canceledAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["subscription"]>;
    composites: {};
};

type $ChannelPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Channel";
    objects: {
        class: $ClassPayload<ExtArgs> | null;
        group: $GroupPayload<ExtArgs> | null;
        organization: $OrganizationPayload<ExtArgs>;
        members: $ChannelMemberPayload<ExtArgs>[];
        messages: $MessagePayload<ExtArgs>[];
        realtimeItems: $RealtimeItemPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        type: ChannelType;
        name: string | null;
        isPrivate: boolean;
        orgId: string;
        classId: string | null;
        groupId: string | null;
        createdAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["channel"]>;
    composites: {};
};

type $ChannelMemberPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ChannelMember";
    objects: {
        channel: $ChannelPayload<ExtArgs>;
        user: $UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        channelId: string;
        role: ParticipantRole;
        joinedAt: Date;
        lastReadAt: Date | null;
    }, ExtArgs["result"]["channelMember"]>;
    composites: {};
};

type $MessagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Message";
    objects: {
        channel: $ChannelPayload<ExtArgs>;
        parent: $MessagePayload<ExtArgs> | null;
        replies: $MessagePayload<ExtArgs>[];
        user: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        content: string;
        createdAt: Date;
        userId: string | null;
        deletedAt: Date | null;
        channelId: string;
        parentId: string | null;
        updatedAt: Date;
    }, ExtArgs["result"]["message"]>;
    composites: {};
};

type $RealtimeItemPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "RealtimeItem";
    objects: {
        channel: $ChannelPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        itemId: string;
        x: number;
        y: number;
        updatedAt: Date;
        id: string;
        channelId: string;
    }, ExtArgs["result"]["realtimeItem"]>;
    composites: {};
};

type $CommentPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Comment";
    objects: {
        deletedByUser: $UserPayload<ExtArgs> | null;
        organization: $OrganizationPayload<ExtArgs>;
        parent: $CommentPayload<ExtArgs> | null;
        replies: $CommentPayload<ExtArgs>[];
        user: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        content: string;
        userId: string | null;
        targetId: string;
        resource: Resource;
        parentId: string | null;
        deletedAt: Date | null;
        deletedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
    }, ExtArgs["result"]["comment"]>;
    composites: {};
};

type $NotificationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Notification";
    objects: {
        user: $UserPayload<ExtArgs>;
        schedule: $SchedulePayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        message: string;
        type: NotificationType;
        read: boolean;
        scheduleId: string | null;
        metadata: runtime.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["notification"]>;
    composites: {};
};

type $PushSubscriptionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PushSubscription";
    objects: {
        user: $UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        endpoint: string;
        p256dh: string;
        auth: string;
        userAgent: string | null;
        deviceId: string | null;
        expiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["pushSubscription"]>;
    composites: {};
};

type $UserDevicePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UserDevice";
    objects: {
        user: $UserPayload<ExtArgs>;
        sessions: $UserSessionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        deviceId: string;
        label: string | null;
        deviceType: DeviceType;
        os: string | null;
        osVersion: string | null;
        browser: string | null;
        browserVersion: string | null;
        isTrusted: boolean;
        firstSeenAt: Date;
        lastSeenAt: Date;
        lastIpAddress: string | null;
        revokedAt: Date | null;
    }, ExtArgs["result"]["userDevice"]>;
    composites: {};
};

type $UserSessionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UserSession";
    objects: {
        user: $UserPayload<ExtArgs>;
        device: $UserDevicePayload<ExtArgs>;
        organization: $OrganizationPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        deviceId: string;
        orgId: string | null;
        status: UserSessionStatus;
        ipAddress: string | null;
        userAgent: string | null;
        authSessionId: string | null;
        createdAt: Date;
        lastActivityAt: Date;
        expiresAt: Date | null;
        revokedAt: Date | null;
        revokedReason: SessionRevokeReason | null;
    }, ExtArgs["result"]["userSession"]>;
    composites: {};
};

type $EvaluationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Evaluation";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        course: $CoursePayload<ExtArgs>;
        grades: $GradePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        orgId: string;
        courseId: string;
        type: EvaluationType;
        title: string;
        coefficient: number;
        maxScore: number;
        datedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["evaluation"]>;
    composites: {};
};

type $GradePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Grade";
    objects: {
        evaluation: $EvaluationPayload<ExtArgs>;
        enrollment: $StudentEnrollmentPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        evaluationId: string;
        enrollmentId: string;
        status: GradeStatus;
        score: number | null;
        comment: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["grade"]>;
    composites: {};
};

type $AdminPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Admin";
    objects: {
        user: $UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["admin"]>;
    composites: {};
};

type $TeacherPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Teacher";
    objects: {
        courses: $CourseTeacherPayload<ExtArgs>[];
        schedules: $SchedulePayload<ExtArgs>[];
        unavailabilities: $TeacherUnavailabilityPayload<ExtArgs>[];
        department: $DepartmentPayload<ExtArgs> | null;
        user: $UserPayload<ExtArgs>;
        courseHours: $TeacherCourseHoursPayload<ExtArgs>[];
        weeklySlots: $WeeklySlotPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: string | null;
    }, ExtArgs["result"]["teacher"]>;
    composites: {};
};

type $StudentPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Student";
    objects: {
        attendances: $AttendancePayload<ExtArgs>[];
        justifications: $JustificationPayload<ExtArgs>[];
        optionalUEs: $OptionalUEPayload<ExtArgs>[];
        childrenRelations: $ParentRelationPayload<ExtArgs>[];
        user: $UserPayload<ExtArgs>;
        studentEnrollments: $StudentEnrollmentPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["student"]>;
    composites: {};
};

type $ParentPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Parent";
    objects: {
        user: $UserPayload<ExtArgs>;
        parentRelations: $ParentRelationPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["parent"]>;
    composites: {};
};

type $DirectionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Direction";
    objects: {
        user: $UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["direction"]>;
    composites: {};
};

type $ParentRelationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ParentRelation";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        parent: $ParentPayload<ExtArgs>;
        student: $StudentPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        parentId: string;
        studentId: string;
        orgId: string;
        relation: string;
        createdAt: Date;
    }, ExtArgs["result"]["parentRelation"]>;
    composites: {};
};

/**
 * Model Schedule
 *
 */
type ScheduleModel = runtime.Types.Result.DefaultSelection<$SchedulePayload>;
type $SchedulePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Schedule";
    objects: {
        attendances: $AttendancePayload<ExtArgs>[];
        class: $ClassPayload<ExtArgs>;
        course: $CoursePayload<ExtArgs>;
        group: $GroupPayload<ExtArgs> | null;
        organization: $OrganizationPayload<ExtArgs>;
        room: $RoomPayload<ExtArgs>;
        teacher: $TeacherPayload<ExtArgs>;
        weekRecurence: $WeekRecurencePayload<ExtArgs> | null;
        session: $SessionPayload<ExtArgs> | null;
        justifications: $JustificationPayload<ExtArgs>[];
        notifications: $NotificationPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        courseId: string;
        roomId: string;
        teacherId: string;
        orgId: string;
        startTime: Date;
        endTime: Date;
        status: ScheduleStatus;
        scheduleType: ScheduleType;
        statusChangedAt: Date | null;
        confirmed: boolean;
        notes: string | null;
        isLocked: boolean;
        createdAt: Date;
        updatedAt: Date;
        classId: string;
        groupId: string | null;
        weekRecurrenceId: string | null;
        deletedAt: Date | null;
        notifyState: ScheduleNotifyState | null;
        notifiedAt: Date | null;
    }, ExtArgs["result"]["schedule"]>;
    composites: {};
};

type $WeeklyTemplatePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WeeklyTemplate";
    objects: {
        weekRecurences: $WeekRecurencePayload<ExtArgs>[];
        slots: $WeeklySlotPayload<ExtArgs>[];
        organization: $OrganizationPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        orgId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["weeklyTemplate"]>;
    composites: {};
};

type $WeeklySlotPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WeeklySlot";
    objects: {
        course: $CoursePayload<ExtArgs>;
        room: $RoomPayload<ExtArgs>;
        teacher: $TeacherPayload<ExtArgs>;
        template: $WeeklyTemplatePayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        templateId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        courseId: string;
        teacherId: string;
        roomId: string;
        scheduleType: ScheduleType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["weeklySlot"]>;
    composites: {};
};

type $WeekRecurencePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WeekRecurence";
    objects: {
        schedules: $SchedulePayload<ExtArgs>[];
        organization: $OrganizationPayload<ExtArgs>;
        template: $WeeklyTemplatePayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        templateId: string;
        orgId: string;
        startDate: Date;
        endDate: Date;
        interval: number;
        excludedDates: Date[];
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["weekRecurence"]>;
    composites: {};
};

type $LocationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Location";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        rooms: $RoomPayload<ExtArgs>[];
        sessions: $SessionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        radius: number;
        active: boolean;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["location"]>;
    composites: {};
};

type $RoomPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Room";
    objects: {
        qrCodes: $QRCodePayload<ExtArgs>[];
        location: $LocationPayload<ExtArgs> | null;
        organization: $OrganizationPayload<ExtArgs>;
        schedules: $SchedulePayload<ExtArgs>[];
        weeklySlots: $WeeklySlotPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        capacity: number | null;
        locationId: string | null;
        orgId: string;
        equipment: string[];
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["room"]>;
    composites: {};
};

type $EventPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Event";
    objects: {
        createdBy: $UserPayload<ExtArgs> | null;
        organization: $OrganizationPayload<ExtArgs>;
        participants: $EventParticipantPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        title: string;
        description: string | null;
        startTime: Date | null;
        endTime: Date | null;
        location: string | null;
        targetRoles: Role[];
        color: string | null;
        type: EventType;
        isRecurring: boolean;
        createdById: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        orgId: string;
        status: EventStatus;
        isPublic: boolean;
    }, ExtArgs["result"]["event"]>;
    composites: {};
};

type $EventParticipantPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "EventParticipant";
    objects: {
        event: $EventPayload<ExtArgs>;
        user: $UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        eventId: string;
        role: ParticipantRole;
        status: EventStatus;
        joinedAt: Date;
    }, ExtArgs["result"]["eventParticipant"]>;
    composites: {};
};

type $TeacherUnavailabilityPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TeacherUnavailability";
    objects: {
        teacher: $TeacherPayload<ExtArgs>;
        organization: $OrganizationPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        teacherId: string;
        orgId: string;
        type: UnavailabilityType;
        dayOfWeek: number | null;
        startTime: Date | null;
        endTime: Date | null;
        startDate: Date | null;
        endDate: Date | null;
        reason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["teacherUnavailability"]>;
    composites: {};
};

type $UserPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "User";
    objects: {
        admin: $AdminPayload<ExtArgs> | null;
        approvalRequested: $ApprovalRequestPayload<ExtArgs>[];
        approvalReviewed: $ApprovalRequestPayload<ExtArgs>[];
        auditLog: $AuditLogPayload<ExtArgs>[];
        channelMemberships: $ChannelMemberPayload<ExtArgs>[];
        moderatedComments: $CommentPayload<ExtArgs>[];
        comments: $CommentPayload<ExtArgs>[];
        direction: $DirectionPayload<ExtArgs>[];
        uploadedDocuments: $DocumentPayload<ExtArgs>[];
        createdEvents: $EventPayload<ExtArgs>[];
        eventParticipations: $EventParticipantPayload<ExtArgs>[];
        invitations: $InvitationPayload<ExtArgs>[];
        justificationsDeclared: $JustificationPayload<ExtArgs>[];
        justificationsReviewed: $JustificationPayload<ExtArgs>[];
        messages: $MessagePayload<ExtArgs>[];
        notifications: $NotificationPayload<ExtArgs>[];
        parent: $ParentPayload<ExtArgs>[];
        assigned: $PermissionPayload<ExtArgs>[];
        permissions: $PermissionPayload<ExtArgs>[];
        pushSubscription: $PushSubscriptionPayload<ExtArgs>[];
        qrScans: $QRScanPayload<ExtArgs>[];
        student: $StudentPayload<ExtArgs>[];
        teacher: $TeacherPayload<ExtArgs>[];
        assignedFunctions: $UserFunctionPayload<ExtArgs>[];
        functions: $UserFunctionPayload<ExtArgs>[];
        userOrganizations: $UserOrganizationPayload<ExtArgs>[];
        devices: $UserDevicePayload<ExtArgs>[];
        sessions: $UserSessionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        sex: Sex;
        phone: string | null;
        avatar_url: string | null;
        dateOfBirth: Date | null;
        nationality: string | null;
        address: string | null;
        isConnected: boolean;
        status: UserStatus;
        details: runtime.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["user"]>;
    composites: {};
};

type $OrganizationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Organization";
    objects: {
        subscription: $SubscriptionPayload<ExtArgs> | null;
        academicYears: $AcademicYearPayload<ExtArgs>[];
        approvalRequests: $ApprovalRequestPayload<ExtArgs>[];
        attendances: $AttendancePayload<ExtArgs>[];
        auditLog: $AuditLogPayload<ExtArgs>[];
        evaluations: $EvaluationPayload<ExtArgs>[];
        channels: $ChannelPayload<ExtArgs>[];
        comments: $CommentPayload<ExtArgs>[];
        justifications: $JustificationPayload<ExtArgs>[];
        courses: $CoursePayload<ExtArgs>[];
        departments: $DepartmentPayload<ExtArgs>[];
        documents: $DocumentPayload<ExtArgs>[];
        events: $EventPayload<ExtArgs>[];
        functions: $FunctionPayload<ExtArgs>[];
        invitations: $InvitationPayload<ExtArgs>[];
        locations: $LocationPayload<ExtArgs>[];
        parentRelations: $ParentRelationPayload<ExtArgs>[];
        settings: $OrganizationSettingsPayload<ExtArgs> | null;
        usage: $OrganizationUsagePayload<ExtArgs> | null;
        permissions: $PermissionPayload<ExtArgs>[];
        programs: $ProgramPayload<ExtArgs>[];
        programTracks: $ProgramTrackPayload<ExtArgs>[];
        rooms: $RoomPayload<ExtArgs>[];
        schedules: $SchedulePayload<ExtArgs>[];
        ues: $UEPayload<ExtArgs>[];
        ueCourses: $UECoursePayload<ExtArgs>[];
        userOrganizations: $UserOrganizationPayload<ExtArgs>[];
        weekRecurences: $WeekRecurencePayload<ExtArgs>[];
        weeklyTemplates: $WeeklyTemplatePayload<ExtArgs>[];
        teacherUnavailabilities: $TeacherUnavailabilityPayload<ExtArgs>[];
        userSessions: $UserSessionPayload<ExtArgs>[];
        teacherCourseHours: $TeacherCourseHoursPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        email: string | null;
        slug: string | null;
        logo: string | null;
        domain: string | null;
        details: runtime.JsonValue | null;
        type: OrganizationType;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        deletedAt: Date | null;
    }, ExtArgs["result"]["organization"]>;
    composites: {};
};

type $OrganizationSettingsPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "OrganizationSettings";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        maxUsers: number;
        storageLimit: bigint;
        maxCourses: number | null;
        maxRooms: number | null;
        maxClasses: number | null;
        timezone: string;
        currency: string;
        language: string;
        parentalNotifications: boolean;
        smsNotifications: boolean;
        emailNotifications: boolean;
        breakDuration: number;
        settings: runtime.JsonValue | null;
        updatedAt: Date;
        orgId: string;
    }, ExtArgs["result"]["organizationSettings"]>;
    composites: {};
};

type $OrganizationUsagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "OrganizationUsage";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        currentUsers: number;
        usedStorage: bigint;
        activeCourses: number;
        activeRooms: number;
        updatedAt: Date;
        orgId: string;
    }, ExtArgs["result"]["organizationUsage"]>;
    composites: {};
};

type $UserOrganizationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UserOrganization";
    objects: {
        department: $DepartmentPayload<ExtArgs> | null;
        organization: $OrganizationPayload<ExtArgs>;
        user: $UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        orgId: string;
        isMainOrg: boolean;
        role: Role;
        status: UserStatus;
        createdAt: Date;
        updatedAt: Date;
        isResponsable: boolean;
        departmentId: string | null;
    }, ExtArgs["result"]["userOrganization"]>;
    composites: {};
};

type $FunctionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Function";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        permissions: $PermissionPayload<ExtArgs>[];
        users: $UserFunctionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        description: string | null;
        orgId: string;
        isMain: boolean;
        createdAt: Date;
        updatedAt: Date;
        icon: string | null;
    }, ExtArgs["result"]["function"]>;
    composites: {};
};

type $UserFunctionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UserFunction";
    objects: {
        function: $FunctionPayload<ExtArgs>;
        user: $UserPayload<ExtArgs>;
        assignedByUser: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        functionId: string;
        assignedAt: Date;
        assignedBy: string | null;
    }, ExtArgs["result"]["userFunction"]>;
    composites: {};
};

type $PermissionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Permission";
    objects: {
        assignedBy: $UserPayload<ExtArgs> | null;
        function: $FunctionPayload<ExtArgs> | null;
        organization: $OrganizationPayload<ExtArgs> | null;
        user: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string | null;
        functionId: string | null;
        assignedById: string | null;
        action: Action;
        resource: Resource | null;
        resourceId: string | null;
        description: string | null;
        isActive: boolean;
        expiresAt: Date | null;
        details: runtime.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        orgId: string | null;
    }, ExtArgs["result"]["permission"]>;
    composites: {};
};

type $InvitationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Invitation";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        user: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        token: string;
        email: string;
        createdAt: Date;
        expiresAt: Date | null;
        usedAt: Date | null;
        userId: string | null;
        details: runtime.JsonValue | null;
        invitationType: InvitationType;
        role: string | null;
        orgId: string;
        resourceId: string | null;
        resourceType: Resource | null;
    }, ExtArgs["result"]["invitation"]>;
    composites: {};
};

type $DocumentPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Document";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        uploadedBy: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        orgId: string;
        resourceType: Resource;
        resourceId: string;
        uploadedById: string | null;
        name: string;
        path: string;
        type: DocumentType;
        createdAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["document"]>;
    composites: {};
};

type $AuditLogPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "AuditLog";
    objects: {
        organization: $OrganizationPayload<ExtArgs> | null;
        user: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string | null;
        action: Action;
        resource: string | null;
        resourceId: string | null;
        details: runtime.JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
        orgId: string | null;
    }, ExtArgs["result"]["auditLog"]>;
    composites: {};
};

type $ApprovalRequestPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ApprovalRequest";
    objects: {
        organization: $OrganizationPayload<ExtArgs>;
        requestedBy: $UserPayload<ExtArgs>;
        reviewedBy: $UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        orgId: string;
        kind: string;
        resourceType: Resource;
        resourceId: string;
        changes: runtime.JsonValue;
        reason: string | null;
        status: ApprovalStatus;
        requestedById: string;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reviewNote: string | null;
        appliedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["approvalRequest"]>;
    composites: {};
};

/**
 * Model Schedule
 *
 */
type Schedule = ScheduleModel;

type ScheduleFilterParams = Partial<Pick<Schedule, 'classId' | 'groupId' | 'teacherId' | 'roomId' | 'weekRecurrenceId' | 'status' | 'confirmed'>> & {
    orgId: string;
    academicYearId?: string;
    rangeStart: Date;
    rangeEnd: Date;
    groupIds?: string[];
};

declare function getSchedulesAction(params: Omit<ScheduleFilterParams, 'orgId'>): Promise<{
    error: string;
    data?: undefined;
} | {
    data: ({
        group: {
            name: string;
            id: string;
        } | null;
        teacher: {
            id: string;
            user: {
                firstName: string | null;
                lastName: string | null;
                avatar_url: string | null;
            };
        };
        class: {
            name: string;
            id: string;
        };
        course: {
            name: string;
            id: string;
        };
        room: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        courseId: string;
        roomId: string;
        teacherId: string;
        orgId: string;
        startTime: Date;
        endTime: Date;
        status: ScheduleStatus;
        scheduleType: ScheduleType;
        statusChangedAt: Date | null;
        confirmed: boolean;
        notes: string | null;
        isLocked: boolean;
        createdAt: Date;
        updatedAt: Date;
        classId: string;
        groupId: string | null;
        weekRecurrenceId: string | null;
        deletedAt: Date | null;
        notifyState: ScheduleNotifyState | null;
        notifiedAt: Date | null;
    })[];
    error?: undefined;
}>;

declare function getClassesAction({ yearId, programTrackId, name, level }?: {
    yearId?: string;
    programTrackId?: string;
    name?: string;
    level?: Level;
}): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        name: string;
        id: string;
        academicYearId: string;
        programTrackId: string;
        level: Level;
        academicYear: {
            name: string;
            id: string;
        };
        programTrack: {
            name: string;
            id: string;
        };
        _count: {
            courses: number;
            studentEnrollments: number;
        };
    }[];
    error?: undefined;
}>;

declare const ACTIONS: {
    readonly getSchedulesAction: typeof getSchedulesAction;
    readonly getClassesAction: typeof getClassesAction;
};

type Actions = typeof ACTIONS;
type ApiClient = {
    [K in keyof Actions]: (...args: Parameters<Actions[K]>) => Promise<Jsonify<Awaited<ReturnType<Actions[K]>>>>;
};
type ApiAction = keyof ApiClient;
type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0];
type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>;

export type { ApiAction, ApiClient, ApiInput, ApiOutput };
