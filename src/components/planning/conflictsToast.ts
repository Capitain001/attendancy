import { toast } from "sonner";

import type { ConflictReportDto } from "@/services/planning/conflict/actions";

export type ConflictResources = {
  courses: Array<{
    id: string;
    name: string;
    teachers: Array<{ id: string; name?: string | null; email?: string | null }>;
  }>;
  rooms: Array<{ id: string; name: string }>;
  groups: Array<{ id: string; name: string }>;
};

function buildTeachersMap(resources: ConflictResources): Map<string, { name: string }> {
  const map = new Map<string, { name: string }>();
  for (const c of resources.courses) {
    for (const t of c.teachers) {
      map.set(t.id, { name: t.name ?? t.email ?? t.id });
    }
  }
  return map;
}

function buildRoomsMap(resources: ConflictResources): Map<string, { name: string }> {
  return new Map(resources.rooms.map((r) => [r.id, { name: r.name }]));
}

function buildGroupsMap(resources: ConflictResources): Map<string, { name: string }> {
  return new Map(resources.groups.map((g) => [g.id, { name: g.name }]));
}

function describeConflictLine(
  c: ConflictReportDto["conflicts"][number],
  maps: {
    rooms: Map<string, { name: string }>;
    teachers: Map<string, { name: string }>;
    groups: Map<string, { name: string }>;
  }
) {
  const parts: string[] = [];
  if (c.reason === "ROOM_OVERLAP") {
    parts.push(`Salle: ${maps.rooms.get(c.roomId)?.name ?? c.roomId}`);
  } else if (c.reason === "TEACHER_OVERLAP") {
    parts.push(`Prof: ${maps.teachers.get(c.teacherId)?.name ?? c.teacherId}`);
  } else if (c.reason === "CLASS_OVERLAP") {
    parts.push("Classe: conflit global");
  } else if (c.reason === "GROUP_OVERLAP") {
    const gid = c.groupId;
    parts.push(`Groupe: ${gid ? maps.groups.get(gid)?.name ?? gid : "—"}`);
  }
  if (c.conflictsWith) {
    parts.push(
      `Occupe par ${new Date(c.conflictsWith.startTime).toLocaleString("fr-FR")} → ${new Date(c.conflictsWith.endTime).toLocaleString("fr-FR")}`
    );
  }
  return `- ${c.message} (${parts.filter(Boolean).join(" | ")})`;
}

export function formatConflictReportForToast(
  report: ConflictReportDto,
  resources: ConflictResources,
  limit = 3
): string {
  const maps = {
    rooms: buildRoomsMap(resources),
    teachers: buildTeachersMap(resources),
    groups: buildGroupsMap(resources),
  };
  const lines = report.conflicts.slice(0, limit).map((c) => describeConflictLine(c, maps));
  const more = report.conflicts.length > limit ? `\n… +${report.conflicts.length - limit} autre(s)` : "";
  return `${lines.join("\n")}${more}`;
}

export function toastScheduleConflict(opts: {
  message: string;
  resources: ConflictResources;
  loadDetails: () => Promise<{ data?: ConflictReportDto; error?: string }>;
}) {
  toast.error(opts.message, {
    position: "bottom-left",
    action: {
      label: "Voir le conflit",
      onClick: async () => {
        const res = await opts.loadDetails();
        if (res.error || !res.data) {
          toast.error(res.error ?? "Impossible de charger les détails du conflit.", { position: "bottom-left" });
          return;
        }
        toast("Conflit détecté", {
          position: "bottom-left",
          description: formatConflictReportForToast(res.data, opts.resources),
          duration: 8000,
        });
      },
    },
  });
}
