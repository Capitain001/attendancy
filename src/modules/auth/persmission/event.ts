import { FunctionName } from "@/config/data";

export const RESOURCE_EVENTS = {
    STUDENT: {
      INVITATION: "STUDENT_INVITATION",
      INSCRIPTION: "STUDENT_INSCRIPTION",
    },
  
    INVITATION: {
      SENT: "INVITATION_SENT",
      RESENT: "INVITATION_RESENT",
      EXPIRED: "INVITATION_EXPIRED",
    },
  } as const;


export type NestedValues<T> = {
    [K in keyof T]: T[K][keyof T[K]];
  }[keyof T];
  
  export type ResourceEvent = NestedValues<typeof RESOURCE_EVENTS>;
    
  export const FUNCTION_ACCESS: Partial<
  Record<FunctionName, readonly string[]>
> = {
  PRINCIPAL: [
    RESOURCE_EVENTS.STUDENT.INVITATION,
    RESOURCE_EVENTS.STUDENT.INSCRIPTION,
  ],

  SECRETARY: [
    RESOURCE_EVENTS.STUDENT.INVITATION,
  ],
} as const;