// apps/web/src/app/(app)/personal/[slug]/teacher/classes/[id]/invitation/page.tsx
// Page serveur 
import { TClassInvitationScreen } from "@/components/users/list/TClassInvitationScreen";
import { getPersonalCoursesAction } from "@/features/personal/services/course";



export default async function CourseInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>
}) {
  const { classId } = await params

  const res = await getPersonalCoursesAction({classId}) 
  const courses = 'error' in res ? [] : res.data
  
  return <TClassInvitationScreen classId={classId} classLabel="Ma classe" />
}