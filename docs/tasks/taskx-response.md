# Revue & Spécification Finale — `inviteStudentsAction` (Bulk)

> Réponse et arbitrage technique sur la proposition [docs/tasks/taskx.md](file:///c:/PROJECTS/PROJECT/PRODUCTIONS/attendancy/docs/tasks/taskx.md) validée contre le code source du monorepo.

---

## 1. Verdict Général

La proposition formulée dans `taskx.md` est **validée dans son architecture**. Elle apporte des améliorations majeures par rapport à la première ébauche :
- **Extraction directe de `invitationId`** depuis `inviteUser` (évite les requêtes de réconciliation a posteriori).
- **Parallélisme contrôlé** (`CONCURRENCY = 5`) avec `Promise.allSettled`.
- **Délégation asynchrone des notifications** via `after()` de Next.js.
- **Filtrage mémoire et base en amont** avant tout appel réseau externe.

Deux ajustements majeurs sont apportés ci-dessous pour respecter les **invariants du projet** et clore les **points ouverts (TODO)**.

---

## 2. Invariants & Arbitrages Techniques

### A. Structure de retour : Invariant `ActionResponse` (`CLAUDE.md`)
Dans `CLAUDE.md`, la règle pour toutes les actions serveur est non négociable :
```ts
// ❌ Rejeté (format taskx.md) :
type Result = { status: "error"; error: string } | { status: "ok"; ... }

// ✅ Règle repo (CLAUDE.md : Retour discriminé) :
type ActionResponse<T> = { data: T } | { error: string }
// Narrowing côté consommateur : if ('error' in result)
```

**Pourquoi ce choix ?**
1. Tous les hooks TanStack Query du projet (`useClassInvitations`, `useEntity`, etc.) inspectent `'error' in res` pour rejeter ou valider.
2. Unifier la forme de retour évite de créer un cas particulier dans le frontend et garantit l'interopérabilité immédiate avec `customToast` et les mutations existantes.

---

### B. Tranchage des points ouverts (`TODO`)

| Point ouvert | État dans le repo | Décision retenue & Justification |
| :--- | :--- | :--- |
| **Version Next.js & `after()`** | `next@16.2.10` dans `apps/web/package.json` | **Validé avec `import { after } from "next/server"`**. Stable depuis Next 15.1. `notifyInvitationStakeholders` est parfaitement autonome (ne requiert ni cookies ni headers de session). |
| **Étudiants déjà inscrits** | Modèle `StudentEnrollment` (`academic.prisma:346`) | **Ajouté en amont à l'étape 5**. Requête groupée `findMany` sur `StudentEnrollment(classId, endedAt: null)`. Rejet immédiat dans `failed` avec le message *"Étudiant déjà inscrit dans cette classe"*. |
| **Invitations en attente (`pending`)** | Invitations avec `usedAt: null` et non expirées | **Rejet dans `failed`** avec *"Invitation déjà en attente"*. Évite de consommer inutilement le quota SMTP Supabase. L'action `resend` unitaire reste dédiée au renvoi intentionnel. |
| **Autorisation TEACHER / classe** | `checkInvitationResources` (`student/database.ts`) | **Conserver la règle actuelle**. Le contrôle RBAC (`DIRECTION` ou `TEACHER`) est scopé à l'organisation (`orgId`). Aucune table n'exige qu'un enseignant dispense déjà un cours spécifique pour inviter des étudiants dans une promotion. |
| **Pool Prisma vs Concurrence** | `PrismaPg` (`apps/web/src/lib/prisma.ts`) | **`CONCURRENCY = 5` validé**. Le driver natif `pg` utilise un pool plafonné par défaut à 10 connexions. Traiter par lots de 5 garantit de ne pas asphyxier le pool pour les requêtes concurrentes. |
| **SMTP Supabase & Limite de lot** | Quotas Supabase Auth | **`maxLength(50)` validé**. 50 requêtes concurrentes découpées en 10 chunks de 5 restent largement sous le seuil d'épuisement des tokens de l'API Supabase tout en restant dans le timeout d'une Server Action (15-30s). |
| **Sensibilité à la casse des emails (DB)** | PostgreSQL texte sensible par défaut | **Ajout de `mode: 'insensitive'`** sur les clauses `in: uniqueEmails` pour `Invitation` et `StudentEnrollment.student.user`, combiné à un `Set` normalisé en minuscules. Empêche tout faux négatif si des emails en base contiennent des majuscules. |
| **Erreurs brutes vs mapping** | Gestion séparée des erreurs | **Suppression de `mapSupabaseError`** du flux d'invitation. On conserve l'erreur brute dans `failed[].error` et on logue explicitement `console.error('[bulk invite] rejet', { email, reason })` en cas de rejet de promesse. |
| **Ordre Supabase puis DB (`inviteUser`)** | Lignes 79-97 de `src/modules/invitation/user.ts` | **Inchangé**. Supabase doit générer le magic link ou envoyer le mail *avant* la persistance DB. En cas d'échec Supabase, on ne pollue pas la table `Invitation` avec un token orphelin non distribuable. |

---

## 3. Spécification Détaillée du Code

### 1. `src/modules/invitation/user.ts`
Exposer l'ID de l'invitation dans le payload de succès (ligne 121) :

```diff
     return {
       data: {
         success: true,
+        invitationId: result.invitation.id,
         message:
           deliveryMethod === "link"
```

---

### 2. `src/modules/invitation/student/validation.ts`
Schéma de validation avec normalisation automatique des emails (`trim` + `toLowerCase`) :

```ts
import * as v from "valibot";
import { inviteStudentSchema } from "./validation";

export const bulkStudentItemSchema = v.object({
  email: v.pipe(
    v.string(),
    v.trim(),
    v.toLowerCase(),
    v.email("Format d'email invalide")
  ),
  firstName: v.optional(v.pipe(v.string(), v.trim())),
  lastName: v.optional(v.pipe(v.string(), v.trim())),
  parentEmail: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.toLowerCase(),
      v.email("Format d'email invalide pour le parent")
    )
  ),
});

export const inviteStudentsBulkSchema = v.object({
  classId: inviteStudentSchema.entries.classId,
  expiresInDays: inviteStudentSchema.entries.expiresInDays,
  groupIds: inviteStudentSchema.entries.groupIds,
  deliveryMethod: inviteStudentSchema.entries.deliveryMethod,
  students: v.pipe(
    v.array(bulkStudentItemSchema),
    v.minLength(1, "Sélectionnez au moins un étudiant"),
    v.maxLength(50, "Maximum 50 invitations par envoi")
  ),
});

export type InviteStudentsBulkInput = v.InferInput<typeof inviteStudentsBulkSchema>;
```

---

### 3. `src/modules/invitation/student/types.ts`
Typage strict aligné sur `ActionResponse` de `CLAUDE.md` :

```ts
export type BulkInviteItemSuccess = {
  email: string;
  invitationId?: string;
  link?: string;
};

export type BulkInviteItemFailure = {
  email: string;
  error: string;
};

export type BulkInviteData = {
  status: "ok" | "partial" | "failed";
  total: number;
  succeeded: BulkInviteItemSuccess[];
  failed: BulkInviteItemFailure[];
};

export type InviteStudentsBulkResult =
  | { data: BulkInviteData }
  | { error: string };
```

---

### 4. `src/modules/invitation/student/actions.ts`
Implémentation complète de `inviteStudentsAction` :

```ts
"use server";

import { after } from "next/server";
import { safeParse } from "valibot";
import { inviteStudentsBulkSchema, type InviteStudentsBulkInput } from "./validation";
import type { InviteStudentsBulkResult, BulkInviteItemSuccess, BulkInviteItemFailure } from "./types";
import { checkInvitationResources } from "./database";
import { inviteUser } from "../user";
import { notifyInvitationStakeholders } from "../notifications";
import { getUserInfo } from "@/services/user";
import { prisma } from "@/lib/prisma";

const CONCURRENCY = 5;

export async function inviteStudentsAction(
  params: InviteStudentsBulkInput
): Promise<InviteStudentsBulkResult> {
  try {
    // ── 1. Validation Valibot ──────────────────────────────────────────
    const parsed = safeParse(inviteStudentsBulkSchema, params);
    if (!parsed.success) {
      return { error: parsed.issues[0]?.message ?? "Paramètres d'invitation invalides" };
    }
    const { classId, students, groupIds, expiresInDays, deliveryMethod } = parsed.output;

    // ── 2. Authentification & Organisation (1 appel) ──────────────────
    const currentUser = await getUserInfo();
    const orgId = currentUser?.organization?.id;
    if (!currentUser?.id || !orgId) {
      return { error: "Organisation introuvable ou session expirée" };
    }

    // ── 3. Vérification des ressources de classe (1 appel) ─────────────
    const check = await checkInvitationResources({ classId, orgId, groupIds });
    if (!check.valid) {
      return { error: check.error ?? "Ressources invalides" };
    }

    // ── 4. Dédoublonnage mémoire dans le lot ──────────────────────────
    const unique = [...new Map(students.map((s) => [s.email, s])).values()];
    const uniqueEmails = unique.map((s) => s.email);

    // ── 5. Pré-filtrage DB groupé (Inscrits + Invitations en attente) ──
    // Note : mode 'insensitive' pour neutraliser tout problème de casse en base
    const [pendingInvitations, existingEnrollments] = await Promise.all([
      prisma.invitation.findMany({
        where: {
          orgId,
          resourceId: classId,
          usedAt: null,
          email: { in: uniqueEmails, mode: "insensitive" },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { email: true },
      }),
      prisma.studentEnrollment.findMany({
        where: {
          classId,
          endedAt: null,
          student: {
            user: { email: { in: uniqueEmails, mode: "insensitive" } },
          },
        },
        select: {
          student: {
            select: { user: { select: { email: true } } },
          },
        },
      }),
    ]);

    const pendingSet = new Set(pendingInvitations.map((p) => p.email.toLowerCase()));
    const enrolledSet = new Set(
      existingEnrollments.map((e) => e.student.user.email.toLowerCase())
    );

    const succeeded: BulkInviteItemSuccess[] = [];
    const failed: BulkInviteItemFailure[] = [];

    const toSend = unique.filter((s) => {
      const emailLower = s.email.toLowerCase();
      if (enrolledSet.has(emailLower)) {
        failed.push({ email: s.email, error: "Étudiant déjà inscrit dans cette classe" });
        return false;
      }
      if (pendingSet.has(emailLower)) {
        failed.push({ email: s.email, error: "Invitation déjà en attente pour cette classe" });
        return false;
      }
      return true;
    });

    // ── 6. Traitement par Chunks (Pool safe) ───────────────────────────
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
        const student = chunk[idx];
        if (r.status === "fulfilled" && !r.value.error && r.value.data) {
          succeeded.push({
            email: student.email,
            invitationId: r.value.data.invitationId,
            link: r.value.data.link,
          });
        } else {
          if (r.status === "rejected") {
            console.error("[bulk invite] rejet", { email: student.email, reason: r.reason });
          }
          failed.push({
            email: student.email,
            error:
              r.status === "fulfilled"
                ? r.value.error ?? "Échec de l'envoi"
                : "Erreur serveur inattendue",
          });
        }
      });
    }

    // ── 7. Tâche d'arrière-plan (Notifications non bloquantes) ──────────
    const actorId = currentUser.id;
    if (succeeded.length > 0) {
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
    }

    // ── 8. Réponse normalisée (ActionResponse) ─────────────────────────
    return {
      data: {
        status: failed.length === 0 ? "ok" : succeeded.length === 0 ? "failed" : "partial",
        total: unique.length,
        succeeded,
        failed,
      },
    };
  } catch (error) {
    console.error("inviteStudentsAction error:", error);
    return { error: "Une erreur inattendue s'est produite lors du traitement du lot" };
  }
}
```
