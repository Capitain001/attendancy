import * as __generated_prisma_enums from '@/generated/prisma/enums';
import { Schedule, Level, OrganizationType } from '@/generated/prisma/browser';
import * as v from 'valibot';
import { InferOutput, InferInput } from 'valibot';
import * as src from 'src';
import * as _prisma_client_runtime_client from '@prisma/client/runtime/client';
import { Level as Level$1 } from '@/generated/prisma/client';

type ScheduleFilterParams = Partial<Pick<Schedule, 'classId' | 'groupId' | 'teacherId' | 'roomId' | 'weekRecurrenceId' | 'status' | 'confirmed'>> & {
    orgId: string;
    academicYearId?: string;
    rangeStart: Date;
    rangeEnd: Date;
    groupIds?: string[];
};
declare function getSchedules(params: ScheduleFilterParams): Promise<({
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
    status: __generated_prisma_enums.ScheduleStatus;
    orgId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    isLocked: boolean;
    classId: string;
    teacherId: string;
    courseId: string;
    scheduleType: __generated_prisma_enums.ScheduleType;
    groupId: string | null;
    notes: string | null;
    roomId: string;
    startTime: Date;
    endTime: Date;
    statusChangedAt: Date | null;
    confirmed: boolean;
    weekRecurrenceId: string | null;
    notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
    notifiedAt: Date | null;
})[]>;

type GetSchedulesDto = Awaited<ReturnType<typeof getSchedules>>;

declare const createScheduleSchema: v.ObjectSchema<{
    courseId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Cours invalide">]>;
    teacherId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Enseignant invalide">]>;
    roomId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Salle invalide">]>;
    classId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Classe invalide">]>;
    groupId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Groupe invalide">]>, undefined>;
    startTime: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de début requise">]>;
    endTime: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de fin requise">]>;
    notes: v.NullableSchema<v.StringSchema<undefined>, undefined>;
    confirmed: v.BooleanSchema<undefined>;
}, undefined>;
type CreateScheduleInput = InferInput<typeof createScheduleSchema>;
type CreateScheduleOutput = InferOutput<typeof createScheduleSchema>;
declare const updateScheduleDataSchema: v.ObjectSchema<{
    courseId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Cours invalide">]>, undefined>;
    teacherId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Enseignant invalide">]>, undefined>;
    roomId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Salle invalide">]>, undefined>;
    classId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Classe invalide">]>, undefined>;
    groupId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Groupe invalide">]>, undefined>;
    startTime: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de début requise">]>, undefined>;
    endTime: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de fin requise">]>, undefined>;
    notes: v.OptionalSchema<v.NullableSchema<v.StringSchema<undefined>, undefined>, undefined>;
    confirmed: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
    status: v.OptionalSchema<v.PicklistSchema<("PENDING" | "CANCELED" | "COMPLETED" | "MISSED")[], undefined>, undefined>;
}, undefined>;
declare const updateScheduleSchema: v.ObjectSchema<Record<"scheduleId", v.SchemaWithPipe<[v.StringSchema<undefined>, v.UuidAction<string, undefined>]>> & {
    data: v.ObjectSchema<{
        courseId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Cours invalide">]>, undefined>;
        teacherId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Enseignant invalide">]>, undefined>;
        roomId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Salle invalide">]>, undefined>;
        classId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Classe invalide">]>, undefined>;
        groupId: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.UuidAction<string, "Groupe invalide">]>, undefined>;
        startTime: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de début requise">]>, undefined>;
        endTime: v.OptionalSchema<v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.NonEmptyAction<string, "Heure de fin requise">]>, undefined>;
        notes: v.OptionalSchema<v.NullableSchema<v.StringSchema<undefined>, undefined>, undefined>;
        confirmed: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        status: v.OptionalSchema<v.PicklistSchema<("PENDING" | "CANCELED" | "COMPLETED" | "MISSED")[], undefined>, undefined>;
    }, undefined>;
}, undefined>;
type UpdateScheduleDataInput = InferInput<typeof updateScheduleDataSchema>;
type UpdateScheduleInput = InferInput<typeof updateScheduleSchema>;

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
        status: __generated_prisma_enums.ScheduleStatus;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isLocked: boolean;
        classId: string;
        teacherId: string;
        courseId: string;
        scheduleType: __generated_prisma_enums.ScheduleType;
        groupId: string | null;
        notes: string | null;
        roomId: string;
        startTime: Date;
        endTime: Date;
        statusChangedAt: Date | null;
        confirmed: boolean;
        weekRecurrenceId: string | null;
        notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
        notifiedAt: Date | null;
    })[];
    error?: undefined;
}>;

declare function createScheduleAction(data: CreateScheduleOutput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
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
        status: __generated_prisma_enums.ScheduleStatus;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isLocked: boolean;
        classId: string;
        teacherId: string;
        courseId: string;
        scheduleType: __generated_prisma_enums.ScheduleType;
        groupId: string | null;
        notes: string | null;
        roomId: string;
        startTime: Date;
        endTime: Date;
        statusChangedAt: Date | null;
        confirmed: boolean;
        weekRecurrenceId: string | null;
        notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
        notifiedAt: Date | null;
    };
    error?: undefined;
}>;
declare function updateScheduleAction(input: UpdateScheduleInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
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
        status: __generated_prisma_enums.ScheduleStatus;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        isLocked: boolean;
        classId: string;
        teacherId: string;
        courseId: string;
        scheduleType: __generated_prisma_enums.ScheduleType;
        groupId: string | null;
        notes: string | null;
        roomId: string;
        startTime: Date;
        endTime: Date;
        statusChangedAt: Date | null;
        confirmed: boolean;
        weekRecurrenceId: string | null;
        notifyState: __generated_prisma_enums.ScheduleNotifyState | null;
        notifiedAt: Date | null;
    };
    error?: undefined;
}>;
declare function deleteScheduleAction(scheduleId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
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
        programTrackId: string;
        level: Level;
        academicYearId: string;
        _count: {
            courses: number;
            studentEnrollments: number;
        };
        academicYear: {
            name: string;
            id: string;
        };
        programTrack: {
            name: string;
            id: string;
        };
    }[];
    error?: undefined;
}>;

/**
 * Liste des classes d'une organisation.
 * Peut être filtrée par année académique et filière.
 */
declare function getClasses({ orgId, yearId, programTrackId, name, level }: {
    orgId: string;
    yearId?: string;
    programTrackId?: string;
    name?: string;
    level?: Level$1;
}): Promise<{
    name: string;
    id: string;
    programTrackId: string;
    level: Level$1;
    academicYearId: string;
    _count: {
        courses: number;
        studentEnrollments: number;
    };
    academicYear: {
        name: string;
        id: string;
    };
    programTrack: {
        name: string;
        id: string;
    };
}[]>;

type GetClassesDto = Awaited<ReturnType<typeof getClasses>>;

declare const deviceIdInputSchema: v.ObjectSchema<{
    readonly deviceId: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 8, "deviceId invalide">, v.MaxLengthAction<string, 200, undefined>]>;
}, undefined>;
type DeviceIdInput = v.InferInput<typeof deviceIdInputSchema>;

declare function registerDeviceAction(input: DeviceIdInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        device: {
            id: string;
            revokedAt: Date | null;
        };
        session: {
            id: string;
            createdAt: Date;
            deviceId: string;
        };
    };
    error?: undefined;
}>;
declare function endSessionAction(input: DeviceIdInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: boolean;
    error?: undefined;
}>;

declare const signupPersonalSchema: v.ObjectSchema<{
    readonly email: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.TrimAction, v.EmailAction<string, "Email invalide">]>;
    readonly password: v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.MinLengthAction<string, 8, "Mot de passe trop court">]>;
}, undefined>;
type SignupPersonalInput = InferInput<typeof signupPersonalSchema>;

declare function signupPersonalDesktopAction(input: SignupPersonalInput): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        email: string;
    };
    error?: undefined;
}>;

/**
 * Fonctions principales du système
 * Source unique de vérité
 */
declare const MAIN_FUNCTIONS: readonly [{
    readonly name: "PRINCIPAL";
    readonly description: "Chef d'établissement, responsable de la gestion globale de l'institution et de la supervision du personnel.";
    readonly icon: "principal.svg";
}, {
    readonly name: "SECRETARY";
    readonly description: "Secrétaire administratif, gestion des dossiers, de la correspondance et des tâches administratives courantes.";
    readonly icon: "secretary.svg";
}, {
    readonly name: "ASSISTANT";
    readonly description: "Assistant administratif, support opérationnel des tâches déléguées par les responsables.";
    readonly icon: "assistant.svg";
}, {
    readonly name: "DELEGATE";
    readonly description: "Délégué de classe, représente des élèves en liaison avec l'administration.";
    readonly icon: "delegate.svg";
}, {
    readonly name: "COORDINATOR";
    readonly description: "Coordinateur pédagogique ou Responsable de discipline";
    readonly icon: "coordinator.svg";
}, {
    readonly name: "MEMBER";
    readonly description: "Membre de l'administration pédagogique";
    readonly icon: "member.svg";
}];
/**
 * Type sécurisé dérivé automatiquement
 * inclue SUPER_ADMIN (admin principal) + les fonctions principales pedagogiques
 */
type FunctionName = (typeof MAIN_FUNCTIONS)[number]["name"] | "SUPER_ADMIN";

declare const roleSchema: v.EnumSchema<{
    readonly ADMIN: "ADMIN";
    readonly TEACHER: "TEACHER";
    readonly STUDENT: "STUDENT";
    readonly PARENT: "PARENT";
    readonly DIRECTION: "DIRECTION";
    readonly GUEST: "GUEST";
}, undefined>;
declare const functionSchema: v.EnumSchema<Record<FunctionName, FunctionName>, undefined>;
declare const statusSchema: v.EnumSchema<{
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly ON_LEAVE: "ON_LEAVE";
    readonly PENDING: "PENDING";
    readonly NEW: "NEW";
    readonly INVITED: "INVITED";
}, undefined>;
type Role = v.InferOutput<typeof roleSchema>;
declare const Functions: Record<FunctionName, FunctionName>;
type Functions = v.InferOutput<typeof functionSchema>;
declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly SUSPENDED: "SUSPENDED";
    readonly ON_LEAVE: "ON_LEAVE";
    readonly PENDING: "PENDING";
    readonly NEW: "NEW";
    readonly INVITED: "INVITED";
};
type UserStatus = v.InferOutput<typeof statusSchema>;
/**
 * app_metadata : tout ce qui sert à autoriser.
 * Écriture réservée au serveur (service role) via `setUserAccess` / `updateUserAccess`.
 * Lecture : sans repli sur `user_metadata`, une clé absente donne la valeur la plus restrictive.
 */
declare const AppMetadataSchema: Omit<v.ObjectSchema<{
    readonly role: v.EnumSchema<{
        readonly ADMIN: "ADMIN";
        readonly TEACHER: "TEACHER";
        readonly STUDENT: "STUDENT";
        readonly PARENT: "PARENT";
        readonly DIRECTION: "DIRECTION";
        readonly GUEST: "GUEST";
    }, undefined>;
    readonly function: v.EnumSchema<Record<FunctionName, FunctionName>, undefined>;
    readonly status: v.EnumSchema<{
        readonly ACTIVE: "ACTIVE";
        readonly INACTIVE: "INACTIVE";
        readonly SUSPENDED: "SUSPENDED";
        readonly ON_LEAVE: "ON_LEAVE";
        readonly PENDING: "PENDING";
        readonly NEW: "NEW";
        readonly INVITED: "INVITED";
    }, undefined>;
    readonly organization: Omit<v.ObjectSchema<{
        readonly id: v.StringSchema<undefined>;
        readonly name: v.StringSchema<undefined>;
        readonly slug: v.StringSchema<undefined>;
        readonly logo: v.StringSchema<undefined>;
        readonly type: v.EnumSchema<{
            readonly INSTITUTION: "INSTITUTION";
            readonly PERSONAL: "PERSONAL";
        }, undefined>;
        readonly permissions: v.ArraySchema<v.StringSchema<undefined>, undefined>;
        readonly responsable: v.BooleanSchema<undefined>;
        readonly departmentId: v.StringSchema<undefined>;
        readonly studentId: v.StringSchema<undefined>;
        readonly teacherId: v.StringSchema<undefined>;
        readonly parentId: v.StringSchema<undefined>;
        readonly directionId: v.StringSchema<undefined>;
    }, undefined>, "~standard" | "~run" | "~types" | "entries"> & {
        readonly entries: {
            readonly id: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly name: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly slug: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly logo: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly type: v.OptionalSchema<v.EnumSchema<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }, undefined>, undefined>;
            readonly permissions: v.OptionalSchema<v.ArraySchema<v.StringSchema<undefined>, undefined>, undefined>;
            readonly responsable: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
            readonly departmentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly studentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly teacherId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly parentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly directionId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        };
        readonly "~standard": v.StandardProps<{
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }, {
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }>;
        readonly "~run": (dataset: v.UnknownDataset, config: v.Config<v.BaseIssue<unknown>>) => v.OutputDataset<{
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }, v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue>;
        readonly "~types"?: {
            readonly input: {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            };
            readonly output: {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            };
            readonly issue: v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue;
        } | undefined;
    };
    readonly organizations: v.ArraySchema<Omit<v.ObjectSchema<{
        readonly id: v.StringSchema<undefined>;
        readonly name: v.StringSchema<undefined>;
        readonly slug: v.StringSchema<undefined>;
        readonly logo: v.StringSchema<undefined>;
        readonly type: v.EnumSchema<{
            readonly INSTITUTION: "INSTITUTION";
            readonly PERSONAL: "PERSONAL";
        }, undefined>;
        readonly permissions: v.ArraySchema<v.StringSchema<undefined>, undefined>;
        readonly responsable: v.BooleanSchema<undefined>;
        readonly departmentId: v.StringSchema<undefined>;
        readonly studentId: v.StringSchema<undefined>;
        readonly teacherId: v.StringSchema<undefined>;
        readonly parentId: v.StringSchema<undefined>;
        readonly directionId: v.StringSchema<undefined>;
    }, undefined>, "~standard" | "~run" | "~types" | "entries"> & {
        readonly entries: {
            readonly id: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly name: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly slug: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly logo: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly type: v.OptionalSchema<v.EnumSchema<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }, undefined>, undefined>;
            readonly permissions: v.OptionalSchema<v.ArraySchema<v.StringSchema<undefined>, undefined>, undefined>;
            readonly responsable: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
            readonly departmentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly studentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly teacherId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly parentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly directionId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        };
        readonly "~standard": v.StandardProps<{
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }, {
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }>;
        readonly "~run": (dataset: v.UnknownDataset, config: v.Config<v.BaseIssue<unknown>>) => v.OutputDataset<{
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }, v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue>;
        readonly "~types"?: {
            readonly input: {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            };
            readonly output: {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            };
            readonly issue: v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue;
        } | undefined;
    }, undefined>;
}, undefined>, "~standard" | "~run" | "~types" | "entries"> & {
    readonly entries: {
        readonly role: v.OptionalSchema<v.EnumSchema<{
            readonly ADMIN: "ADMIN";
            readonly TEACHER: "TEACHER";
            readonly STUDENT: "STUDENT";
            readonly PARENT: "PARENT";
            readonly DIRECTION: "DIRECTION";
            readonly GUEST: "GUEST";
        }, undefined>, undefined>;
        readonly function: v.OptionalSchema<v.EnumSchema<Record<FunctionName, FunctionName>, undefined>, undefined>;
        readonly status: v.OptionalSchema<v.EnumSchema<{
            readonly ACTIVE: "ACTIVE";
            readonly INACTIVE: "INACTIVE";
            readonly SUSPENDED: "SUSPENDED";
            readonly ON_LEAVE: "ON_LEAVE";
            readonly PENDING: "PENDING";
            readonly NEW: "NEW";
            readonly INVITED: "INVITED";
        }, undefined>, undefined>;
        readonly organization: v.OptionalSchema<Omit<v.ObjectSchema<{
            readonly id: v.StringSchema<undefined>;
            readonly name: v.StringSchema<undefined>;
            readonly slug: v.StringSchema<undefined>;
            readonly logo: v.StringSchema<undefined>;
            readonly type: v.EnumSchema<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }, undefined>;
            readonly permissions: v.ArraySchema<v.StringSchema<undefined>, undefined>;
            readonly responsable: v.BooleanSchema<undefined>;
            readonly departmentId: v.StringSchema<undefined>;
            readonly studentId: v.StringSchema<undefined>;
            readonly teacherId: v.StringSchema<undefined>;
            readonly parentId: v.StringSchema<undefined>;
            readonly directionId: v.StringSchema<undefined>;
        }, undefined>, "~standard" | "~run" | "~types" | "entries"> & {
            readonly entries: {
                readonly id: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly name: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly slug: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly logo: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly type: v.OptionalSchema<v.EnumSchema<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }, undefined>, undefined>;
                readonly permissions: v.OptionalSchema<v.ArraySchema<v.StringSchema<undefined>, undefined>, undefined>;
                readonly responsable: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
                readonly departmentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly studentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly teacherId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly parentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly directionId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            };
            readonly "~standard": v.StandardProps<{
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            }, {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            }>;
            readonly "~run": (dataset: v.UnknownDataset, config: v.Config<v.BaseIssue<unknown>>) => v.OutputDataset<{
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            }, v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue>;
            readonly "~types"?: {
                readonly input: {
                    id?: string | undefined;
                    name?: string | undefined;
                    slug?: string | undefined;
                    logo?: string | undefined;
                    type?: v.EnumValues<{
                        readonly INSTITUTION: "INSTITUTION";
                        readonly PERSONAL: "PERSONAL";
                    }> | undefined;
                    permissions?: string[] | undefined;
                    responsable?: boolean | undefined;
                    departmentId?: string | undefined;
                    studentId?: string | undefined;
                    teacherId?: string | undefined;
                    parentId?: string | undefined;
                    directionId?: string | undefined;
                };
                readonly output: {
                    id?: string | undefined;
                    name?: string | undefined;
                    slug?: string | undefined;
                    logo?: string | undefined;
                    type?: v.EnumValues<{
                        readonly INSTITUTION: "INSTITUTION";
                        readonly PERSONAL: "PERSONAL";
                    }> | undefined;
                    permissions?: string[] | undefined;
                    responsable?: boolean | undefined;
                    departmentId?: string | undefined;
                    studentId?: string | undefined;
                    teacherId?: string | undefined;
                    parentId?: string | undefined;
                    directionId?: string | undefined;
                };
                readonly issue: v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue;
            } | undefined;
        }, undefined>;
        readonly organizations: v.OptionalSchema<v.ArraySchema<Omit<v.ObjectSchema<{
            readonly id: v.StringSchema<undefined>;
            readonly name: v.StringSchema<undefined>;
            readonly slug: v.StringSchema<undefined>;
            readonly logo: v.StringSchema<undefined>;
            readonly type: v.EnumSchema<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }, undefined>;
            readonly permissions: v.ArraySchema<v.StringSchema<undefined>, undefined>;
            readonly responsable: v.BooleanSchema<undefined>;
            readonly departmentId: v.StringSchema<undefined>;
            readonly studentId: v.StringSchema<undefined>;
            readonly teacherId: v.StringSchema<undefined>;
            readonly parentId: v.StringSchema<undefined>;
            readonly directionId: v.StringSchema<undefined>;
        }, undefined>, "~standard" | "~run" | "~types" | "entries"> & {
            readonly entries: {
                readonly id: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly name: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly slug: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly logo: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly type: v.OptionalSchema<v.EnumSchema<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }, undefined>, undefined>;
                readonly permissions: v.OptionalSchema<v.ArraySchema<v.StringSchema<undefined>, undefined>, undefined>;
                readonly responsable: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
                readonly departmentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly studentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly teacherId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly parentId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly directionId: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            };
            readonly "~standard": v.StandardProps<{
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            }, {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            }>;
            readonly "~run": (dataset: v.UnknownDataset, config: v.Config<v.BaseIssue<unknown>>) => v.OutputDataset<{
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            }, v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue>;
            readonly "~types"?: {
                readonly input: {
                    id?: string | undefined;
                    name?: string | undefined;
                    slug?: string | undefined;
                    logo?: string | undefined;
                    type?: v.EnumValues<{
                        readonly INSTITUTION: "INSTITUTION";
                        readonly PERSONAL: "PERSONAL";
                    }> | undefined;
                    permissions?: string[] | undefined;
                    responsable?: boolean | undefined;
                    departmentId?: string | undefined;
                    studentId?: string | undefined;
                    teacherId?: string | undefined;
                    parentId?: string | undefined;
                    directionId?: string | undefined;
                };
                readonly output: {
                    id?: string | undefined;
                    name?: string | undefined;
                    slug?: string | undefined;
                    logo?: string | undefined;
                    type?: v.EnumValues<{
                        readonly INSTITUTION: "INSTITUTION";
                        readonly PERSONAL: "PERSONAL";
                    }> | undefined;
                    permissions?: string[] | undefined;
                    responsable?: boolean | undefined;
                    departmentId?: string | undefined;
                    studentId?: string | undefined;
                    teacherId?: string | undefined;
                    parentId?: string | undefined;
                    directionId?: string | undefined;
                };
                readonly issue: v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue;
            } | undefined;
        }, undefined>, undefined>;
    };
    readonly "~standard": v.StandardProps<{
        role?: v.EnumValues<{
            readonly ADMIN: "ADMIN";
            readonly TEACHER: "TEACHER";
            readonly STUDENT: "STUDENT";
            readonly PARENT: "PARENT";
            readonly DIRECTION: "DIRECTION";
            readonly GUEST: "GUEST";
        }> | undefined;
        function?: v.EnumValues<Record<FunctionName, FunctionName>> | undefined;
        status?: v.EnumValues<{
            readonly ACTIVE: "ACTIVE";
            readonly INACTIVE: "INACTIVE";
            readonly SUSPENDED: "SUSPENDED";
            readonly ON_LEAVE: "ON_LEAVE";
            readonly PENDING: "PENDING";
            readonly NEW: "NEW";
            readonly INVITED: "INVITED";
        }> | undefined;
        organization?: {
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        } | undefined;
        organizations?: {
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }[] | undefined;
    }, {
        role?: v.EnumValues<{
            readonly ADMIN: "ADMIN";
            readonly TEACHER: "TEACHER";
            readonly STUDENT: "STUDENT";
            readonly PARENT: "PARENT";
            readonly DIRECTION: "DIRECTION";
            readonly GUEST: "GUEST";
        }> | undefined;
        function?: v.EnumValues<Record<FunctionName, FunctionName>> | undefined;
        status?: v.EnumValues<{
            readonly ACTIVE: "ACTIVE";
            readonly INACTIVE: "INACTIVE";
            readonly SUSPENDED: "SUSPENDED";
            readonly ON_LEAVE: "ON_LEAVE";
            readonly PENDING: "PENDING";
            readonly NEW: "NEW";
            readonly INVITED: "INVITED";
        }> | undefined;
        organization?: {
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        } | undefined;
        organizations?: {
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }[] | undefined;
    }>;
    readonly "~run": (dataset: v.UnknownDataset, config: v.Config<v.BaseIssue<unknown>>) => v.OutputDataset<{
        role?: v.EnumValues<{
            readonly ADMIN: "ADMIN";
            readonly TEACHER: "TEACHER";
            readonly STUDENT: "STUDENT";
            readonly PARENT: "PARENT";
            readonly DIRECTION: "DIRECTION";
            readonly GUEST: "GUEST";
        }> | undefined;
        function?: v.EnumValues<Record<FunctionName, FunctionName>> | undefined;
        status?: v.EnumValues<{
            readonly ACTIVE: "ACTIVE";
            readonly INACTIVE: "INACTIVE";
            readonly SUSPENDED: "SUSPENDED";
            readonly ON_LEAVE: "ON_LEAVE";
            readonly PENDING: "PENDING";
            readonly NEW: "NEW";
            readonly INVITED: "INVITED";
        }> | undefined;
        organization?: {
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        } | undefined;
        organizations?: {
            id?: string | undefined;
            name?: string | undefined;
            slug?: string | undefined;
            logo?: string | undefined;
            type?: v.EnumValues<{
                readonly INSTITUTION: "INSTITUTION";
                readonly PERSONAL: "PERSONAL";
            }> | undefined;
            permissions?: string[] | undefined;
            responsable?: boolean | undefined;
            departmentId?: string | undefined;
            studentId?: string | undefined;
            teacherId?: string | undefined;
            parentId?: string | undefined;
            directionId?: string | undefined;
        }[] | undefined;
    }, v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue>;
    readonly "~types"?: {
        readonly input: {
            role?: v.EnumValues<{
                readonly ADMIN: "ADMIN";
                readonly TEACHER: "TEACHER";
                readonly STUDENT: "STUDENT";
                readonly PARENT: "PARENT";
                readonly DIRECTION: "DIRECTION";
                readonly GUEST: "GUEST";
            }> | undefined;
            function?: v.EnumValues<Record<FunctionName, FunctionName>> | undefined;
            status?: v.EnumValues<{
                readonly ACTIVE: "ACTIVE";
                readonly INACTIVE: "INACTIVE";
                readonly SUSPENDED: "SUSPENDED";
                readonly ON_LEAVE: "ON_LEAVE";
                readonly PENDING: "PENDING";
                readonly NEW: "NEW";
                readonly INVITED: "INVITED";
            }> | undefined;
            organization?: {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            } | undefined;
            organizations?: {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            }[] | undefined;
        };
        readonly output: {
            role?: v.EnumValues<{
                readonly ADMIN: "ADMIN";
                readonly TEACHER: "TEACHER";
                readonly STUDENT: "STUDENT";
                readonly PARENT: "PARENT";
                readonly DIRECTION: "DIRECTION";
                readonly GUEST: "GUEST";
            }> | undefined;
            function?: v.EnumValues<Record<FunctionName, FunctionName>> | undefined;
            status?: v.EnumValues<{
                readonly ACTIVE: "ACTIVE";
                readonly INACTIVE: "INACTIVE";
                readonly SUSPENDED: "SUSPENDED";
                readonly ON_LEAVE: "ON_LEAVE";
                readonly PENDING: "PENDING";
                readonly NEW: "NEW";
                readonly INVITED: "INVITED";
            }> | undefined;
            organization?: {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            } | undefined;
            organizations?: {
                id?: string | undefined;
                name?: string | undefined;
                slug?: string | undefined;
                logo?: string | undefined;
                type?: v.EnumValues<{
                    readonly INSTITUTION: "INSTITUTION";
                    readonly PERSONAL: "PERSONAL";
                }> | undefined;
                permissions?: string[] | undefined;
                responsable?: boolean | undefined;
                departmentId?: string | undefined;
                studentId?: string | undefined;
                teacherId?: string | undefined;
                parentId?: string | undefined;
                directionId?: string | undefined;
            }[] | undefined;
        };
        readonly issue: v.StringIssue | v.ObjectIssue | v.EnumIssue | v.ArrayIssue | v.BooleanIssue;
    } | undefined;
};
/**
 * user_metadata : données de profil.
 * Modifiables par le client (API Auth + clé publique) → ne JAMAIS s'en servir
 * pour autoriser une action.
 * Écriture : `setUserInfo` (utilisateur courant) ou `updateUserMetadata` (utilisateur cible).
 */
declare const UserMetadataSchema: Omit<v.ObjectSchema<{
    readonly name: v.StringSchema<undefined>;
    readonly avatar_url: v.StringSchema<undefined>;
    readonly phone: v.StringSchema<undefined>;
    readonly isConnected: v.BooleanSchema<undefined>;
    readonly invited_by: Omit<v.ObjectSchema<{
        readonly id: v.StringSchema<undefined>;
        readonly name: v.StringSchema<undefined>;
        readonly email: v.StringSchema<undefined>;
    }, undefined>, "~standard" | "~run" | "~types" | "entries"> & {
        readonly entries: {
            readonly id: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly name: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            readonly email: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        };
        readonly "~standard": v.StandardProps<{
            id?: string | undefined;
            name?: string | undefined;
            email?: string | undefined;
        }, {
            id?: string | undefined;
            name?: string | undefined;
            email?: string | undefined;
        }>;
        readonly "~run": (dataset: v.UnknownDataset, config: v.Config<v.BaseIssue<unknown>>) => v.OutputDataset<{
            id?: string | undefined;
            name?: string | undefined;
            email?: string | undefined;
        }, v.StringIssue | v.ObjectIssue>;
        readonly "~types"?: {
            readonly input: {
                id?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            };
            readonly output: {
                id?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            };
            readonly issue: v.StringIssue | v.ObjectIssue;
        } | undefined;
    };
    readonly invitationToken: v.StringSchema<undefined>;
    readonly invitationType: v.StringSchema<undefined>;
}, undefined>, "~standard" | "~run" | "~types" | "entries"> & {
    readonly entries: {
        readonly name: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        readonly avatar_url: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        readonly phone: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        readonly isConnected: v.OptionalSchema<v.BooleanSchema<undefined>, undefined>;
        readonly invited_by: v.OptionalSchema<Omit<v.ObjectSchema<{
            readonly id: v.StringSchema<undefined>;
            readonly name: v.StringSchema<undefined>;
            readonly email: v.StringSchema<undefined>;
        }, undefined>, "~standard" | "~run" | "~types" | "entries"> & {
            readonly entries: {
                readonly id: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly name: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
                readonly email: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
            };
            readonly "~standard": v.StandardProps<{
                id?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            }, {
                id?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            }>;
            readonly "~run": (dataset: v.UnknownDataset, config: v.Config<v.BaseIssue<unknown>>) => v.OutputDataset<{
                id?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            }, v.StringIssue | v.ObjectIssue>;
            readonly "~types"?: {
                readonly input: {
                    id?: string | undefined;
                    name?: string | undefined;
                    email?: string | undefined;
                };
                readonly output: {
                    id?: string | undefined;
                    name?: string | undefined;
                    email?: string | undefined;
                };
                readonly issue: v.StringIssue | v.ObjectIssue;
            } | undefined;
        }, undefined>;
        readonly invitationToken: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
        readonly invitationType: v.OptionalSchema<v.StringSchema<undefined>, undefined>;
    };
    readonly "~standard": v.StandardProps<{
        name?: string | undefined;
        avatar_url?: string | undefined;
        phone?: string | undefined;
        isConnected?: boolean | undefined;
        invited_by?: {
            id?: string | undefined;
            name?: string | undefined;
            email?: string | undefined;
        } | undefined;
        invitationToken?: string | undefined;
        invitationType?: string | undefined;
    }, {
        name?: string | undefined;
        avatar_url?: string | undefined;
        phone?: string | undefined;
        isConnected?: boolean | undefined;
        invited_by?: {
            id?: string | undefined;
            name?: string | undefined;
            email?: string | undefined;
        } | undefined;
        invitationToken?: string | undefined;
        invitationType?: string | undefined;
    }>;
    readonly "~run": (dataset: v.UnknownDataset, config: v.Config<v.BaseIssue<unknown>>) => v.OutputDataset<{
        name?: string | undefined;
        avatar_url?: string | undefined;
        phone?: string | undefined;
        isConnected?: boolean | undefined;
        invited_by?: {
            id?: string | undefined;
            name?: string | undefined;
            email?: string | undefined;
        } | undefined;
        invitationToken?: string | undefined;
        invitationType?: string | undefined;
    }, v.StringIssue | v.ObjectIssue | v.BooleanIssue>;
    readonly "~types"?: {
        readonly input: {
            name?: string | undefined;
            avatar_url?: string | undefined;
            phone?: string | undefined;
            isConnected?: boolean | undefined;
            invited_by?: {
                id?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            } | undefined;
            invitationToken?: string | undefined;
            invitationType?: string | undefined;
        };
        readonly output: {
            name?: string | undefined;
            avatar_url?: string | undefined;
            phone?: string | undefined;
            isConnected?: boolean | undefined;
            invited_by?: {
                id?: string | undefined;
                name?: string | undefined;
                email?: string | undefined;
            } | undefined;
            invitationToken?: string | undefined;
            invitationType?: string | undefined;
        };
        readonly issue: v.StringIssue | v.ObjectIssue | v.BooleanIssue;
    } | undefined;
};
type AppMetadata = v.InferOutput<typeof AppMetadataSchema>;
type UserMetadata = v.InferOutput<typeof UserMetadataSchema>;
/**
 * Champs fournis par Supabase Auth ou calculés à l'exécution :
 * jamais écrits dans les metadata, aucun code ne les parcourt.
 */
interface AuthMetadata {
    id?: string;
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    online_at?: string;
    /** Fourni par Supabase Auth (user.updated_at), mis à jour à chaque updateUser/updateUserById. */
    updated_at?: string;
}
/** Vue unifiée : l'appelant ne sait pas de quel magasin vient un champ. */
interface UserInfo extends AppMetadata, UserMetadata, AuthMetadata {
}
interface PublicOrganization {
    id?: string;
    name?: string;
    slug?: string;
    logo?: string;
    type?: OrganizationType;
}
/**
 * UserInfo sans les champs critiques : le type à utiliser dans tous les composants client.
 * Pour un besoin ponctuel : `PublicUserInfo & { phone_verified: boolean }`.
 */
interface PublicUserInfo {
    id?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
    role?: Role;
    function?: Functions;
    status?: UserStatus;
    phone?: string;
    phone_verified?: boolean;
    email_verified?: boolean;
    online_at?: string;
    updated_at?: string;
    isConnected?: boolean;
    invitationToken?: string;
    organization?: PublicOrganization;
}

declare function getCurrentUserAction(): Promise<{
    data: src.UserInfo;
    error?: undefined;
} | {
    error: string;
    data?: undefined;
}>;

declare function getNotifications(limit?: number): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        type: __generated_prisma_enums.NotificationType;
        metadata: _prisma_client_runtime_client.JsonValue;
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduleId: string | null;
        read: boolean;
    }[];
    error?: undefined;
}>;
declare function getUnread(limit?: number): Promise<{
    error: string;
    data?: undefined;
} | {
    data: {
        type: __generated_prisma_enums.NotificationType;
        metadata: _prisma_client_runtime_client.JsonValue;
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scheduleId: string | null;
        read: boolean;
    }[];
    error?: undefined;
}>;
declare function getUnreadCount(): Promise<{
    error: string;
    data?: undefined;
} | {
    data: number;
    error?: undefined;
}>;

declare function markNotificationAsRead(notificationId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
    error?: undefined;
}>;
declare function markAllRead(): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
    error?: undefined;
}>;
declare function deleteNotification(notificationId: string): Promise<{
    error: string;
    data?: undefined;
} | {
    data: true;
    error?: undefined;
}>;

declare function getNotificationsForUser(userId: string, limit?: number): Promise<{
    type: __generated_prisma_enums.NotificationType;
    metadata: _prisma_client_runtime_client.JsonValue;
    message: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    scheduleId: string | null;
    read: boolean;
}[]>;
declare function getUnreadNotificationsForUser(userId: string, limit?: number): Promise<{
    type: __generated_prisma_enums.NotificationType;
    metadata: _prisma_client_runtime_client.JsonValue;
    message: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    scheduleId: string | null;
    read: boolean;
}[]>;
declare function getUnreadCountForUser(userId: string): Promise<number>;

declare const notificationTypeSchema: v.PicklistSchema<["ABSENCE", "COURSE_CHANGE", "NEW_COURSE", "SCHEDULE_UPDATE", "GENERAL", "MESSAGE", "INVITATION"], undefined>;

type GetNotificationsForUserDto = Awaited<ReturnType<typeof getNotificationsForUser>>;
type GetUnreadNotificationsForUserDto = Awaited<ReturnType<typeof getUnreadNotificationsForUser>>;
type GetUnreadCountForUserDto = Awaited<ReturnType<typeof getUnreadCountForUser>>;

type NotificationItem = Awaited<ReturnType<typeof getNotificationsForUser>>[number];

declare const ACTIONS: {
    readonly getSchedulesAction: typeof getSchedulesAction;
    readonly createScheduleAction: typeof createScheduleAction;
    readonly updateScheduleAction: typeof updateScheduleAction;
    readonly deleteScheduleAction: typeof deleteScheduleAction;
    readonly getClassesAction: typeof getClassesAction;
    readonly registerDeviceAction: typeof registerDeviceAction;
    readonly endSessionAction: typeof endSessionAction;
    readonly getCurrentUserAction: typeof getCurrentUserAction;
    readonly signupPersonalDesktopAction: typeof signupPersonalDesktopAction;
    readonly getNotifications: typeof getNotifications;
    readonly getUnread: typeof getUnread;
    readonly getUnreadCount: typeof getUnreadCount;
    readonly markNotificationAsRead: typeof markNotificationAsRead;
    readonly markAllRead: typeof markAllRead;
    readonly deleteNotification: typeof deleteNotification;
};

type NotificationType = v.InferOutput<typeof notificationTypeSchema>;

type Actions = typeof ACTIONS;
type ApiClient = {
    [K in keyof Actions]: (...args: Parameters<Actions[K]>) => Promise<Awaited<ReturnType<Actions[K]>>>;
};
type ApiAction = keyof ApiClient;
type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0];
type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>;

export { type ApiAction, type ApiClient, type ApiInput, type ApiOutput, type CreateScheduleInput, type GetClassesDto, type GetNotificationsForUserDto, type GetSchedulesDto, type GetUnreadCountForUserDto, type GetUnreadNotificationsForUserDto, type NotificationItem, type NotificationType, type PublicOrganization, type PublicUserInfo, type UpdateScheduleDataInput, type UserInfo, UserStatus };
