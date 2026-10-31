// apps/web/src/app/(app)/personal/[slug]/teacher/classes/[id]/invitation/page.tsx
// Page serveur : charge les étudiants et délègue l'UI à l'écran client.

import { TClassInvitationScreen } from "@/components/users/list/TClassInvitationScreen";
import { getStudentsAction } from "@/services/student";


export default async function ClassInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>
}) {
  const { classId } = await params

  // const res = await getStudentsAction() 
  // const students = 'error' in res ? [] : res.data
  
  return <TClassInvitationScreen classId={classId} classLabel="Ma classe"  />
}