import { NotificationHistory } from "@/components/notification/ui/NotificationHistory";

export function TeacherNotificationsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Consultez vos notifications et messages.
        </p>
      </div>

      <NotificationHistory />
    </div>
  );
}

