// src/app/(app)/personal/[slug]/teacher/sessions/page.tsx
// apps/web/src/app/(app)/personal/[slug]/teacher/sessions/page.tsx
import Link from "next/link";
import { connection } from "next/server";
import { getCurrentTeacherId } from "@/services/teacher";
import { getTeacherPastSessionsAction } from "@/services/session";
import { TeacherPastSessionList } from "@/components/session/TeacherPastSessionList";


export default async function PersonalTeacherSessionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();

  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return <div />;

  const current = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const response = await getTeacherPastSessionsAction({ teacherId, page: current });

  if ("error" in response) {
    return <p role="alert" className="p-6 text-sm text-destructive">{response.error}</p>;
  }

  const base = `/personal/${encodeURIComponent(slug)}/teacher/sessions`;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-lg font-semibold">Sessions passées</h1>
      </header>
      <TeacherPastSessionList sessions={response.data.sessions} slug={slug} />

      <nav className="flex justify-between text-sm" aria-label="Pagination">
        {current > 1 ? (
          <Link href={`${base}?page=${current - 1}`} className="hover:underline">
            ← Plus récentes
          </Link>
        ) : <span />}
        {response.data.hasNext && (
          <Link href={`${base}?page=${current + 1}`} className="hover:underline">
            Plus anciennes →
          </Link>
        )}
      </nav>
    </div>
  );
}