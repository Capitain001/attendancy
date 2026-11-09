// apps/web/src/app/(app)/personal/[slug]/teacher/sessions/[sessionId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { getSessionReportAction } from "@/services/session";
import { TeacherSessionSummaryScreen } from "@/components/personal/teacher/screen/TeacherSessionSummaryScreen";

export const metadata: Metadata = {
  title: "Résumé de la séance | Attendancy",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ slug: string; sessionId: string }>;
}

export default async function PersonalTeacherSessionSummaryPage({
  params,
}: PageProps) {
  await connection();
  const { slug, sessionId } = await params;

  const res = await getSessionReportAction(sessionId);

  if ("error" in res) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-muted-foreground">{res.error}</p>
        <Link
          href={`/personal/${encodeURIComponent(slug)}/teacher`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return <TeacherSessionSummaryScreen report={res.data} slug={slug} />;
}

