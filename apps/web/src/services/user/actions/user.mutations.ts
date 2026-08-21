"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { updateUserSchema, updateUserDataSchema } from "../validation";
import type { UpdateUserInput, UpdateCurrentUserInput } from "../validation";
import { updateUser, updateUserProfile } from "../database";
import { logAuditAsync } from "@/services/audit";
import { setUserInfo } from "@/modules/user/update";
import { tryCatch } from "@/utils/server";
import { getFullName } from "@/lib/utils";
import { UserMetadata } from "@/types";

export async function updateUserProfileAction(input: UpdateCurrentUserInput) {
  const parsed = v.safeParse(updateUserDataSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  try {
    const result = await updateUserProfile(user.id, parsed.output, orgId);

    const metadata: UserMetadata = {};

    if (parsed.output.firstName !== undefined || parsed.output.lastName !== undefined) {
      const newName = getFullName(result.firstName, result.lastName);
      if (newName !== user.name) {
        metadata.name = newName;
      }
    }
    if (parsed.output.phone !== undefined) {
      metadata.phone = parsed.output.phone ?? undefined; // null → undefined
    }

    if (Object.keys(metadata).length > 0) {
      await tryCatch(setUserInfo(metadata), "setUserInfo");
    }

    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "USER",
      resourceId: user.id,
      actor: { name: user.name, email: user.email },
      details: { updatedFields: Object.keys(parsed.output) },
    });

    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function updateUserAction(input: UpdateUserInput) {
  const parsed = v.safeParse(updateUserSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const targetUserId = parsed.output.userId;

  // Seul l'utilisateur lui-même, ou un ADMIN/DIRECTION peut modifier ce profil
  if (targetUserId !== user.id && user.role !== 'ADMIN' && user.role !== 'DIRECTION') {
    return { error: "Non autorisé à modifier ce profil" };
  }

  try {
    const result = await updateUser(targetUserId, parsed.output.data, orgId);

    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "USER",
      resourceId: targetUserId,
      actor: { name: user.name, email: user.email },
      details: { updatedFields: Object.keys(parsed.output.data) },
    });

    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
