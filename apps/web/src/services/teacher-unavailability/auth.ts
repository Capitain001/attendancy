// src/services/teacher-unavailability/auth.ts
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";

type TeacherAuthContext = {
  orgId: string;
  teacherId: string;
};

// Résout auth + orgId + teacherId de l'enseignant courant en un seul appel.
// Ne pas utiliser getCurrentTeacherId() (service teacher) ici : il refait
// son propre authAccess() sans requiredRole, ce qui doublerait l'appel et
// perdrait la vérification de rôle. On compose sur le auth.data déjà
// résolu par le requiredRole: "TEACHER" ci-dessous.
export async function requireTeacherContext() {
  const auth = await authAccess({ requiredRole: "TEACHER" });
  if (!auth.data) return { error: auth.error };

  const teacherId = auth.data.user.organization?.teacherId;
  if (!teacherId) return { error: `${ERRORS.AUTH.PROFILE}, profil requis : teacher` };

  return { data: { orgId: auth.data.orgId, teacherId } };
}