// src/services/auth/constants.ts
import { Role } from '@/generated/prisma/browser'
export const PERSONAL_SIGNUP_ROLES = [
  Role.TEACHER,
  Role.STUDENT,
  Role.PARENT,
] as const satisfies readonly Role[]

export type PersonalSignupRole = (typeof PERSONAL_SIGNUP_ROLES)[number]

export const PERSONAL_ROLES = [
  Role.TEACHER,
  Role.STUDENT,
  Role.PARENT,
] as const satisfies readonly Role[]

export type PersonalRole = (typeof PERSONAL_SIGNUP_ROLES)[number]