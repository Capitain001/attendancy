// Notifications étudiant — visuel porté de la V1.
import { NotificationsView } from "@/components/student/notifications";

export default function StudentNotificationsPage() {
  return (
    <div className="flex flex-col gap-6 pb-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Quoi de neuf
        </p>
        <h1 className="font-display mt-1 text-4xl font-bold tracking-tight">
          Notifications
        </h1>
      </header>
      <NotificationsView />
    </div>
  );
}
