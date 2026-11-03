# PROPROSITION
## 1. `inviteUser`: renvoyer l'id de l'invitation

```ts
// src/modules/invitation/user/actions.ts (fin de inviteUser)
return {
  data: {
    success: true,
    invitationId: result.invitation.id, // ← ajout
    message: /* inchangé */,
    metadata,
    ...(invitationLink ? { link: invitationLink } : {}),
  },
};
```

## 2. Validation

```ts
// src/modules/invitation/student/validation.ts
const studentItemSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email("Format d'email invalide")),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  parentEmail: v.optional(
    v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email("Format d'email invalide pour le parent"))
  ),
});

export const inviteStudentsBulkSchema = v.object({
  classId: inviteStudentSchema.entries.classId,
  expiresInDays: inviteStudentSchema.entries.expiresInDays,
  groupIds: inviteStudentSchema.entries.groupIds,
  deliveryMethod: inviteStudentSchema.entries.deliveryMethod,
  students: v.pipe(
    v.array(studentItemSchema),
    v.minLength(1, "Sélectionne au moins un étudiant"),
    v.maxLength(50, "Maximum 50 invitations par envoi"), // TODO(IA interne): ajuster selon maxDuration et le SMTP Supabase
  ),
});

export type InviteStudentsBulkInput = v.InferInput<typeof inviteStudentsBulkSchema>;
```

## 3. Types

```ts
// src/modules/invitation/student/types.ts
export type InviteStudentsBulkResult =
  | { status: "error"; error: string }
  | {
      status: "ok" | "partial" | "failed";
      total: number;
      succeeded: { email: string; invitationId?: string; link?: string }[];
      failed: { email: string; error: string }[];
    };
```

## 4. Action

```ts
// src/modules/invitation/student/actions.ts
import { after } from "next/server"; // TODO(IA interne): vérifier la version de Next (≥15.1, sinon unstable_after) et la compatibilité de notifyInvitationStakeholders dans after()
import { inviteStudentsBulkSchema, type InviteStudentsBulkInput } from "./validation";
import type { InviteStudentsBulkResult } from "./types";

const CONCURRENCY = 5; // TODO(IA interne): ajuster selon le pool Prisma (transactions jusqu'à 20 s)

export async function inviteStudentsAction(
  params: InviteStudentsBulkInput
): Promise<InviteStudentsBulkResult> {
  try {
    // 1. Validation
    const parsed = safeParse(inviteStudentsBulkSchema, params);
    if (!parsed.success) {
      return { status: "error", error: parsed.issues[0]?.message ?? "Paramètres invalides" };
    }
    const { classId, students, groupIds, expiresInDays, deliveryMethod } = parsed.output;

    // 2. Utilisateur + organisation (réchauffe le LRU)
    const { getUserInfo } = await import("@/services/user"); // TODO(IA interne): harmoniser l'import avec le reste du module
    const currentUser = await getUserInfo();
    const orgId = currentUser?.organization?.id;
    if (!currentUser?.id || !orgId) {
      return { status: "error", error: "Organisation non trouvée. Vous devez être associé à une organisation." };
    }

    // 3. Ressources (classe + groupes), une seule fois
    const check = await checkInvitationResources({ classId, orgId, groupIds });
    if (!check.valid) return { status: "error", error: check.error ?? "Ressources invalides" };
    // TODO(IA interne): un TEACHER est-il rattaché à cette classe ? Vérification à ajouter si nécessaire.

    // 4. Dédoublonnage (emails déjà normalisés par le schéma)
    const unique = [...new Map(students.map((s) => [s.email, s])).values()];

    // 5. Invitations déjà en attente : 1 requête pour tout le lot
    const { prisma } = await import("@/lib/prisma");
    const pending = await prisma.invitation.findMany({
      where: {
        orgId,
        resourceId: classId,
        usedAt: null,
        email: { in: unique.map((s) => s.email) },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { email: true },
    });
    const pendingSet = new Set(pending.map((p) => p.email.toLowerCase()));
    // TODO(IA interne): comportement voulu pour une invitation pending (ignorer / renvoyer / erreur) ?
    // TODO(IA interne): détecter aussi les étudiants déjà inscrits à la classe si un modèle d'inscription existe.

    const succeeded: { email: string; invitationId?: string; link?: string }[] = [];
    const failed: { email: string; error: string }[] = [];

    const toSend = unique.filter((s) => {
      if (!pendingSet.has(s.email)) return true;
      failed.push({ email: s.email, error: "Invitation déjà en attente" });
      return false;
    });

    // 6. Envoi par paquets, tolérant aux pannes
    for (let i = 0; i < toSend.length; i += CONCURRENCY) {
      const chunk = toSend.slice(i, i + CONCURRENCY);

      const settled = await Promise.allSettled(
        chunk.map((s) =>
          inviteUser({
            email: s.email,
            name: [s.firstName, s.lastName].filter(Boolean).join(" ") || undefined,
            role: "STUDENT",
            expiresInDays: expiresInDays ?? 7,
            resourceId: classId,
            resourceType: "CLASS",
            deliveryMethod,
            ...(groupIds?.length || s.parentEmail
              ? {
                  details: {
                    enrollment: {
                      classId,
                      ...(groupIds?.length ? { groupIds } : {}),
                      ...(s.parentEmail ? { parentEmail: s.parentEmail } : {}),
                    },
                  },
                }
              : {}),
          })
        )
      );

      settled.forEach((r, idx) => {
        const email = chunk[idx].email;
        if (r.status === "fulfilled" && !r.value.error) {
          succeeded.push({
            email,
            invitationId: r.value.data?.invitationId,
            link: r.value.data?.link,
          });
        } else {
          if (r.status === "rejected") console.error("[bulk invite]", email, r.reason);
          // TODO(IA interne): mapper r.value.error (message Supabase brut) vers un message générique, idéalement dans inviteUser
          failed.push({
            email,
            error: r.status === "fulfilled" ? r.value.error! : "Erreur inattendue",
          });
        }
      });
    }

    // 7. Notifications après la réponse
    const actorId = currentUser.id;
    after(async () => {
      await Promise.allSettled(
        succeeded
          .filter((s) => s.invitationId)
          .map((s) =>
            notifyInvitationStakeholders({
              invitationId: s.invitationId!,
              orgId,
              actorId,
              event: "CREATED",
              invitedEmail: s.email,
              classId,
            })
          )
      );
    });

    // 8. Retour
    return {
      status: failed.length === 0 ? "ok" : succeeded.length === 0 ? "failed" : "partial",
      total: unique.length,
      succeeded,
      failed,
    };
  } catch (error) {
    console.error("inviteStudentsAction error:", error);
    return { status: "error", error: "Une erreur inattendue s'est produite lors de l'invitation" };
  }
}
```

## 5. Points laissés à l'IA interne

Brief à coller avec le code :

```md
Juge cette proposition contre le repo. Corrige ce qui est faux, et tranche les TODO(IA interne).
Points ouverts : version de Next et `after()`, comportement sur invitation pending, détection d'un étudiant déjà inscrit,
autorisation TEACHER/classe, mapping des erreurs Supabase, taille du pool Prisma vs CONCURRENCY,
SMTP Supabase (limite en mode "email"), ordre Supabase puis DB dans inviteUser.
Hors sujet : findAuthUserByEmail. Ne pas y toucher.
Réponds avec un verdict court et des diffs minimaux, sans modifier le code avant validation.
```