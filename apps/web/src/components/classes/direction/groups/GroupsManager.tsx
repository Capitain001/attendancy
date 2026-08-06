"use client";

import { useState } from "react";

import { MetricCard } from "@/components/stats/ui/MetricCard";
import { CollapseSection } from "@/components/layout/CollapseSection";
import { useClassGroups } from "@/hooks/data/groups/use-class-groups";
import { CreateGroupButton } from "./CreateGroupButton";
import { GroupManageDialog, type ManagedGroup } from "./GroupManageDialog";

interface GroupsManagerProps {
  classId: string;
  enrollmentHref: string;
}

export function GroupsManager({ classId, enrollmentHref }: GroupsManagerProps) {
  const { groups, classInfo, createGroup } = useClassGroups(classId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = groups.find((g) => g.id === selectedId) ?? null;
  const selectedManaged: ManagedGroup | null = selected
    ? {
        id: selected.id,
        name: selected.name,
        description: selected.description,
        count: selected._count.studentGroups,
      }
    : null;

  // V2 : classInfo = { id, name, _count: { studentEnrollments } } | null
  const classStudentCount = classInfo?._count?.studentEnrollments ?? 0;
  const totalMembers = groups.reduce((acc, g) => acc + g._count.studentGroups, 0);
  const avgPerGroup = groups.length > 0 ? Math.round(totalMembers / groups.length) : 0;

  return (
    <>
      <section className="grid grid-cols-3 gap-3">
        <MetricCard label="Groupes" value={String(groups.length)} sub="dans la classe" />
        <MetricCard
          label="Étudiants inscrits"
          value={String(classStudentCount)}
          sub="effectif de la classe"
          href={enrollmentHref}
        />
        <MetricCard label="Effectif moyen" value={String(avgPerGroup)} sub="membres par groupe" />
      </section>

      <CollapseSection label="Groupes" count={groups.length} defaultOpen>
        <div className="mb-3 flex justify-end">
          <CreateGroupButton classId={classId} submit={createGroup} />
        </div>

        {groups.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedId(g.id)}
                className="rounded-lg bg-muted/50 p-4 text-left transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-[14px] font-medium text-foreground">
                    {g.name}
                  </p>
                  <span className="shrink-0 font-mono text-[13px] tabular-nums text-muted-foreground">
                    {g._count.studentGroups}
                  </span>
                </div>
                {g.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {g.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card py-16">
            <svg
              className="size-8 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="9" cy="7" r="3" />
              <path d="M3 21v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
              <path d="M16 3.5a3 3 0 0 1 0 7M21 21v-1a6 6 0 0 0-4-5.66" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-muted-foreground">Aucun groupe dans cette classe.</p>
          </div>
        )}
      </CollapseSection>

      <GroupManageDialog
        classId={classId}
        group={selectedManaged}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
