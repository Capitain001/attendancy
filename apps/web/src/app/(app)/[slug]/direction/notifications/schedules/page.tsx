import { DirectionNotificationsView } from "@/components/direction/notifications/DirectionNotificationsView";

export default function DirectionScheduleNotificationsPage() {
  return (
    <div className="flex flex-col gap-6 pb-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Organisation
        </p>
        <h1 className="font-display mt-1 text-4xl font-bold tracking-tight">
          Notifications
        </h1>
      </header>
      <DirectionNotificationsView />
    </div>
  );
}
