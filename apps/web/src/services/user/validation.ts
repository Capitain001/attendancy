import { object, string, pipe, trim, maxLength, optional, nullable, date, custom } from "valibot";
import type { InferInput, InferOutput } from "valibot";
import { validateWithId } from "@/utils/server/validation";
import type { UpdateUserData } from "./types";
import type { Prisma } from "@/generated/prisma/client";

const jsonValue = custom<Prisma.InputJsonValue>(() => true);

export const updateUserDataSchema = object({
  firstName: optional(nullable(pipe(string(), trim(), maxLength(100)))),
  lastName: optional(nullable(pipe(string(), trim(), maxLength(100)))),
  email: optional(pipe(string(), trim(), maxLength(100))),
  phone: optional(nullable(pipe(string(), trim(), maxLength(20)))),
  avatar_url: optional(nullable(pipe(string(), trim(), maxLength(500)))),
  sex: optional(custom<"MALE" | "FEMALE" | "OTHER">((v) => v === "MALE" || v === "FEMALE" || v === "OTHER")),
  dateOfBirth: optional(nullable(date())),
  details: optional(jsonValue),
} satisfies Record<keyof UpdateUserData, unknown>);

// Schéma pour l'utilisateur courant (sans ID explicite venant du client)
export type UpdateCurrentUserInput = InferInput<typeof updateUserDataSchema>;
export type UpdateCurrentUserOutput = InferOutput<typeof updateUserDataSchema>;

// Schéma standard (avec ID) pour l'admin
export const updateUserSchema = validateWithId("userId", updateUserDataSchema);
export type UpdateUserInput = InferInput<typeof updateUserSchema>;
export type UpdateUserOutput = InferOutput<typeof updateUserSchema>;
