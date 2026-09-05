import { notFound } from "next/navigation";


import { getClassAction } from "@/services/class";
import { ClassEnrollmentPage } from "@/components/classes/direction/enrollment/ClassEnrollmentPage";

interface PageProps {
  params: Promise<{ classId: string; slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { classId } = await params;

  if (!classId) {
    notFound();
  }

  const { data: classData, error } = await getClassAction({classId});

  if (error || !classData) {
    notFound();
  }

  return <ClassEnrollmentPage classId={classId} classData={classData} />;
}
