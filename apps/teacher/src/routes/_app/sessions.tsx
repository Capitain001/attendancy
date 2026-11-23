import { createFileRoute } from "@tanstack/react-router";
import TeacherSessionPage from "@/components/session/TeacherSessionPage";
import { useAuthUser } from "@attendancy/auth";
import { CircleDashed } from "lucide-react";

export const Route = createFileRoute("/_app/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const user = useAuthUser();
  const teacherId = user?.organization?.teacherId;

  if (!teacherId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 text-muted-foreground">
        <CircleDashed className="size-8" />
        <span className="text-sm">Aucun profil enseignant associé</span>
      </div>
    );
  }

  return <TeacherSessionPage teacherId={teacherId} />;
}
