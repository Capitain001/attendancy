import type { Metadata } from "next";
import { connection } from "next/server";
import { getClassAction } from "@/services/class";
import { TClassStudentsScreen } from "@/components/users/list/TClassStudentsScreen";

export const metadata: Metadata = {
  title: "Étudiants de la classe | Attendancy",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ slug: string; classId: string }>;
}

export default async function ClassStudentsPage({ params }: PageProps) {
  await connection();
  const { slug, classId } = await params;

  const classRes = await getClassAction({ classId });
  const classLabel = "data" in classRes ? classRes.data?.name ?? "Classe" : "Classe";

  return (
    <TClassStudentsScreen
      classId={classId}
      classLabel={classLabel}
      slug={slug}
    />
  );
}

