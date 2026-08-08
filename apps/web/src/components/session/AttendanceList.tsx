"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAttendanceList } from "@/hooks/data/attendances/use-attendance-list";
import { type GetScheduleAttendancesDto } from "@/services/attendance";
type AttendanceItem = GetScheduleAttendancesDto[number];
import {
  AttendanceCard,
  AttendanceEmptyState,
  AttendanceSection,
  AttendanceSkeleton,
} from "./attendance-list";

interface AttendanceListProps {
  scheduleId: string;
  className?: string;
}

export function AttendanceList({ scheduleId, className }: AttendanceListProps) {
  const {
    attendances,
    byStatus,
    isLoading,
    isPending,
    isConfirmingId,
    confirmOne,
    confirmMany,
    confirmAll,
  } = useAttendanceList({ scheduleId });

  const pending = byStatus["PENDING"] ?? [];
  const confirmed = byStatus["PRESENT"] ?? [];

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds((prev) => {
      const pendingIds = new Set(pending.map((a) => a.id));
      const next = new Set([...prev].filter((id) => pendingIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [pending]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const isAllSelected = pending.length > 0 && selectedIds.size === pending.length;
  const isPartialSelected = selectedIds.size > 0 && selectedIds.size < pending.length;

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(isAllSelected ? new Set() : new Set(pending.map((a) => a.id)));
  }, [isAllSelected, pending]);

  const handleConfirmSelection = () => {
    confirmMany([...selectedIds]);
    setSelectedIds(new Set());
  };

  if (isLoading) return <AttendanceSkeleton />;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] font-medium text-foreground leading-none">Présences</p>
          <p className="text-[11px] text-muted-foreground">
            <span className="tabular-nums">{attendances.length}</span> étudiants
            {" · "}
            <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
              {confirmed.length}
            </span>{" "}
            confirmé{confirmed.length > 1 ? "s" : ""}
          </p>
        </div>

        <AnimatePresence>
          {pending.length > 0 && selectedIds.size === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.13 }}
            >
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-[11px] font-medium text-muted-foreground"
                onClick={confirmAll}
                disabled={isPending.any}
              >
                <CheckCheck className="size-3" />
                {isPending.all ? "Validation…" : `Tout valider (${pending.length})`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="py-1">
          {pending.length > 0 && (
            <AttendanceSection
              label="En attente"
              count={pending.length}
              variant="pending"
              defaultOpen
              action={
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Tout sélectionner</span>
                  <Checkbox
                    checked={isAllSelected}
                    data-state={
                      isPartialSelected ? "indeterminate" : isAllSelected ? "checked" : "unchecked"
                    }
                    onCheckedChange={toggleSelectAll}
                    disabled={isPending.any}
                    aria-label="Tout sélectionner"
                    className="size-3.5"
                  >
                    {isPartialSelected && <Minus className="size-2.5 text-primary" />}
                  </Checkbox>
                </div>
              }
            >
              <AnimatePresence mode="popLayout">
                {pending.map((a: AttendanceItem) => (
                  <AttendanceCard
                    key={a.id}
                    attendance={a}
                    variant="pending"
                    onConfirm={() => confirmOne(a.id)}
                    isConfirming={isConfirmingId(a.id)}
                    isSelected={selectedIds.has(a.id)}
                    onToggleSelect={() => toggleSelect(a.id)}
                    disabled={isPending.any}
                  />
                ))}
              </AnimatePresence>
            </AttendanceSection>
          )}

          {pending.length > 0 && confirmed.length > 0 && (
            <div className="border-t border-border my-1" />
          )}

          {confirmed.length > 0 && (
            <AttendanceSection
              label="Confirmés"
              count={confirmed.length}
              variant="confirmed"
              defaultOpen={pending.length === 0}
            >
              <AnimatePresence mode="popLayout">
                {confirmed.map((a: AttendanceItem) => (
                  <AttendanceCard key={a.id} attendance={a} variant="confirmed" />
                ))}
              </AnimatePresence>
            </AttendanceSection>
          )}

          {attendances.length === 0 && <AttendanceEmptyState />}
        </div>
      </ScrollArea>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center justify-between px-3.5 py-2 border-t border-border bg-muted/40"
          >
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] text-muted-foreground"
                onClick={() => setSelectedIds(new Set())}
                disabled={isPending.many}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1 text-[11px]"
                onClick={handleConfirmSelection}
                disabled={isPending.many}
              >
                <CheckCheck className="size-3" />
                {isPending.many ? "Confirmation…" : `Confirmer (${selectedIds.size})`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
