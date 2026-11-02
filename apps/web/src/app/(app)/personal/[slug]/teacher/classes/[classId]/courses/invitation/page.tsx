// apps/web/src/app/(app)/personal/[slug]/teacher/classes/[classId]/invitation/page.tsx
import { TCourseEnrollScreen } from "@/components/personal/teacher/screen/TCourseEnrollScreen";
import { getPersonalCoursesAction } from "@/features/personal/services/course";

export default async function CourseInvitationPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { classId } = await params;

  const res = await getPersonalCoursesAction({ classId });
  const courses = "error" in res ? [] : res.data;

  return <TCourseEnrollScreen classId={classId} courses={courses} />;
}