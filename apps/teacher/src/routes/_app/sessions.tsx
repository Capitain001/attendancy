import { createFileRoute } from "@tanstack/react-router";
import TeacherSessionPage from "@/components/session/TeacherSessionPage";
import { useCurrentUser } from "@attendancy/auth";
import { CircleDashed } from "lucide-react";

export const Route = createFileRoute("/_app/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const teacherId = user?.organization?.teacherId;

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <CircleDashed className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
