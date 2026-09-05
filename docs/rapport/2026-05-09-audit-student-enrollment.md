# Audit du service Student Enrollment

Cet audit analyse la sécurité, la robustesse et la gestion du cache du service `student-enrollment` tel qu'implémenté dans `database/student-enrollment.mutations.ts`.

---

## 1. Problèmes Identifiés

### [P1] Faille d'isolation Multi-Tenants à la création
**Fichier :** `database/student-enrollment.mutations.ts` (`createStudentEnrollment`)
Les paramètres `data.studentId` et `data.classId` sont insérés directement dans la base de données sans vérifier qu'ils appartiennent bien à l'`orgId` du contexte en cours. Un utilisateur malveillant pourrait s'inscrire ou inscrire un étudiant dans la classe d'une autre organisation en fournissant simplement un UUID valide.

### [P2] Défaut de vérification d'appartenance à la suppression et modification
**Fichier :** `database/student-enrollment.mutations.ts` (`removeStudentEnrollment`, `updateStudentEnrollment`)
Ces mutations s'appuient uniquement sur `studentEnrollmentId` pour cibler la ligne à mettre à jour. L'`orgId` est passé en argument à la fonction mais n'est pas utilisé pour s'assurer que l'inscription manipulée appartient bien à l'utilisateur courant.

### [P3] Vulnérabilité lors de la mise à jour des relations
**Fichier :** `database/student-enrollment.mutations.ts` (`updateStudentEnrollment`)
La mutation `update` permet la mise à jour optionnelle de `studentId` et `classId`. Rien ne garantit que les nouveaux identifiants potentiellement fournis dans le payload respectent le périmètre de l'organisation.

### [P4] Invalidation de cache incomplète (compteur de classe)
**Fichier :** `database/student-enrollment.mutations.ts` (`updateStudentEnrollment`)
Si la mutation modifie le champ `classId` d'une inscription pour la déplacer vers une autre classe, le code actuel lit uniquement le *nouveau* `classId` via la valeur de retour (`result.classId`) et l'utilise pour invalider le cache de la nouvelle classe. Le cache de l'*ancienne* classe n'est pas invalidé, ce qui implique que son compteur d'étudiants restera artificiellement gonflé.

---

## 2. Propositions de Fixes (REJETÉES POUR P1, P2, P3)

> [!WARNING]
> **Les propositions de sécurité FIX-P1, FIX-P2 et FIX-P3 ont été formellement rejetées.**
> Ces solutions impliqueraient des requêtes SQL supplémentaires (`findFirst`) qui dégraderaient significativement les performances du service. La décision actée (voir `docs/architectures/student-enrollment.md`) est d'assumer ces failles de vérification côté applicatif (App Layer) et de déléguer la sécurité d'isolation directement à la Base de Données (DB Layer) ultérieurement.

### FIX-P1 : Sécuriser les relations à la création (REJETÉ)
**Référence :** Résout le problème [P1]
Avant d'exécuter `prisma.studentEnrollment.create`, effectuer deux requêtes `findFirst` de vérification.

### FIX-P2 : Vérifier le propriétaire de l'inscription (REJETÉ)
**Référence :** Résout le problème [P2]
Pour les méthodes `update` et `remove`, commencer par récupérer l'inscription existante en filtrant spécifiquement sur le tenant.

### FIX-P3 : Valider les nouvelles cibles de l'Update (REJETÉ)
**Référence :** Résout le problème [P3]
Si le payload inclut un nouveau `data.classId` ou `data.studentId`, appliquer la vérification via `findFirst`.

---

## 3. Explorations de Solutions pour P4 (Invalidation de Cache)

Pour résoudre le problème [P4] sans recourir à des requêtes `findFirst` (qui ont été rejetées), voici 3 approches possibles avec leur code associé.

### Solution 1 : Fournir l'ancien `classId` dans le Payload (Recommandée)
L'action serveur passe l'ancien `classId` qu'elle possède déjà, évitant ainsi toute requête SQL supplémentaire dans la base de données.

```typescript
// 1. Mise à jour du type de données
export type UpdateStudentEnrollmentDataOutput = {
  classId?: string;
  studentId?: string;
  endedAt?: string | null;
  oldClassId?: string; // <-- Ajout optionnel envoyé par le client/action
};

// 2. Dans database/student-enrollment.mutations.ts
export async function updateStudentEnrollment(studentEnrollmentId: string, orgId: string, data: UpdateStudentEnrollmentDataOutput) {
  let oldClassId = data.oldClassId;

  // Fallback : si oldClassId n'est pas fourni par l'action et qu'on tente de changer de classe,
  // on fait la requête supplémentaire pour garantir une invalidation correcte.
  if (!oldClassId && data.classId) {
    const existing = await prisma.studentEnrollment.findUnique({
      where: { id: studentEnrollmentId },
      select: { classId: true }
    });
    oldClassId = existing?.classId;
  }

  const result = await tryConstraint(
    prisma.studentEnrollment.update({
      where: { id: studentEnrollmentId },
      data: {
        classId: data.classId,
        studentId: data.studentId,
        endedAt: data.endedAt,
      },
      select: { id: true, classId: true },
    }),
  );

  const classIds = new Set([result.classId, oldClassId].filter(Boolean) as string[]);
  for (const _classId of classIds) {
    await invalidateEvent("STUDENT_ENROLLMENT_UPDATED", orgId, _classId, studentEnrollmentId);
  }

  return result;
}
```

### Solution 2 : Imposer Remove + Create au lieu d'Update
On interdit la mise à jour de `classId` sur l'inscription. L'utilisateur ou l'interface doit désinscrire puis réinscrire, déclenchant naturellement l'invalidation des deux classes.

```typescript
// 1. Dans validation.ts : Retirer classId et studentId de l'Update
export const updateStudentEnrollmentDataSchema = v.object({
  endedAt: v.optional(v.nullable(v.pipe(v.string(), v.isoDateTime('Date de fin invalide')))),
  // classId et studentId sont interdits ici !
});

// 2. Côté interface/action (Changement de classe d'un étudiant)
export async function changeStudentClassAction(studentEnrollmentId: string, newClassId: string, studentId: string) {
  // 2.1 On termine l'ancienne inscription (invalide l'ancienne classe)
  await removeStudentEnrollment(studentEnrollmentId, orgId);
  
  // 2.2 On crée la nouvelle inscription (invalide la nouvelle classe)
  await createStudentEnrollment({ classId: newClassId, studentId }, orgId);
}
```

### Solution 3 : Requête SQL Ciblée (Rejetée d'office selon la directive de performance)
Incluse uniquement pour comparaison. Elle récupère l'ancienne classe avant la modification.

```typescript
export async function updateStudentEnrollment(studentEnrollmentId: string, orgId: string, data: UpdateStudentEnrollmentDataOutput) {
  // [REJETÉ] : Requête supplémentaire
  const existing = await prisma.studentEnrollment.findUnique({
    where: { id: studentEnrollmentId },
    select: { classId: true }
  });

  const result = await tryConstraint(
    prisma.studentEnrollment.update({
      where: { id: studentEnrollmentId },
      data,
      select: { id: true, classId: true },
    }),
  );

  if (existing && data.classId && data.classId !== existing.classId) {
    await invalidateEvent("STUDENT_ENROLLMENT_UPDATED", orgId, existing.classId, studentEnrollmentId);
    await invalidateEvent("STUDENT_ENROLLMENT_UPDATED", orgId, result.classId, studentEnrollmentId);
  } else {
    await invalidateEvent("STUDENT_ENROLLMENT_UPDATED", orgId, result.classId, studentEnrollmentId);
  }
  return result;
}
```
