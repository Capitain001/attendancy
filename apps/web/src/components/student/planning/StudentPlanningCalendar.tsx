"use client";

// Wrapper client du planning étudiant : porte le `renderEventDialog` (non sérialisable
// depuis une page RSC) + force le mode lecture seule (pas de drag).

import { EventCalendar } from "@/components/event-calendar";
import type { ScheduleEvent } from "@/components/event-calendar";
import { StudentSessionDialog } from "./StudentSessionDialog";

export function StudentPlanningCalendar({ events }: { events: ScheduleEvent[] }) {
  return (
    <EventCalendar
      title="Mon planning"
      events={events}
      readOnly
      renderEventDialog={(props) => <StudentSessionDialog {...props} />}
    />
  );
}
