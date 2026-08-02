
import { getUserInfo } from "./userInfo";

export async function getUserSession() {
  const user = await getUserInfo();

  return {
    userId: user?.id ?? null,
    role: user?.role ?? null,

    orgId: user?.organization?.id ?? null,

    studentId: user?.organization?.studentId ?? null,
    teacherId: user?.organization?.teacherId ?? null,
    parentId: user?.organization?.parentId ?? null,
    directionId: user?.organization?.directionId ?? null,
  };
}
