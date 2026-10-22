import { createFileRoute } from "@tanstack/react-router";
import TeacherDailyScreen from "@/components/teacher/personal/screen/TeacherDailyScreen";

export const Route = createFileRoute("/_app/home")({
  component: TeacherHomePage,
});

function TeacherHomePage() {
  return <TeacherDailyScreen sessionsHref="/sessions" />;
}
