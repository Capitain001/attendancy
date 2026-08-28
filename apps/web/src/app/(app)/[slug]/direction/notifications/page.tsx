// Notifications direction — notifs personnelles de l'utilisateur connecté.
import { NotificationsView } from "@/components/student/notifications";

export default function DirectionNotificationsPage() {
  return (
    <div className="flex flex-col gap-6 pb-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Mes Notifications
        </p>
        <h1 className="font-display mt-1 text-4xl font-bold tracking-tight">
          Notifications
        </h1>
      </header>
      <NotificationsView />
    </div>
  );
}
