//src/services/user-organization/database/user-organization.mutations.ts
"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import {
  suspendOrgUserSchema,
  activateOrgUserSchema,
  reintegrateUserOrganizationSchema,
  type SuspendOrgUserInput,
  type ActivateOrgUserInput,
  type ReintegrateUserOrganizationInput,
} from "../validation";
import { suspendOrgUser, activateOrgUser, reintegrateUserOrganization } from "../database";
import { logAuditAsync } from "@/services/audit";

export async function suspendOrgUserAction(input: SuspendOrgUserInput) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const parsed = v.safeParse(suspendOrgUserSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  // Garde métier : un user ne peut pas se suspendre lui-même depuis ce
  // panel — il perdrait l'accès à sa propre org sans personne côté produit
  // pour le réactiver (hors passage support).
  if (parsed.output.userId === user.id) {
    return { error: "Vous ne pouvez pas modifier votre propre statut." };
  }

  try {
    const result = await suspendOrgUser(parsed.output.userId, orgId);
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "USER_ORGANIZATION",
      resourceId: parsed.output.userId,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}


export async function activateOrgUserAction(input: ActivateOrgUserInput) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const parsed = v.safeParse(activateOrgUserSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

    if (parsed.output.userId === user.id) {
    return { error: "Vous ne pouvez pas modifier votre propre statut." };
  }

  try {
    const result = await activateOrgUser(parsed.output.userId, orgId);
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "USER_ORGANIZATION",
      resourceId: parsed.output.userId,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

// ⚠️ requiredRole repris à "DIRECTION" par cohérence, mais la réintégration
// d'un membre définitivement sorti est probablement une décision plus
// lourde qu'une suspension/activation — à reconsidérer (ADMIN uniquement ?)
// selon votre politique interne.
export async function reintegrateUserOrganizationAction(input: ReintegrateUserOrganizationInput) {
  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  const parsed = v.safeParse(reintegrateUserOrganizationSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }
    if (parsed.output.userId === user.id) {
    return { error: "Vous ne pouvez pas modifier votre propre statut." };
  }

  try {
    const result = await reintegrateUserOrganization(parsed.output.userId, orgId);
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "USER_ORGANIZATION",
      resourceId: parsed.output.userId,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}