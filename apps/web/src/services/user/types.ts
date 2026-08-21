export * from "./generated.types";
import type { Prisma } from "@/generated/prisma/client";

export type UpdateUserData = Pick<
  Prisma.UserUncheckedUpdateInput,
  'firstName' | 'lastName' | 'email' | 'phone' | 'avatar_url' | 'dateOfBirth' | 'sex' | 'details'
>;
