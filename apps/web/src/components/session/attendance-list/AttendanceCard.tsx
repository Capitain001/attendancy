"use client";

import { motion } from "framer-motion";
import { CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/date";
import { cn, getNameColor } from "@/lib/utils";
import { type GetScheduleAttendancesDto } from "@/services/attendance";
type AttendanceItem = GetScheduleAttendancesDto[number];

interface AttendanceCardProps {
  attendance: AttendanceItem;
  variant: "pending" | "confirmed";
  onConfirm?: () => void;
  isConfirming?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  disabled?: boolean;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const letters = (
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.slice(0, 2)
  ).toUpperCase();

  return (
    <div
      className="size-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold text-white"
      style={{ backgroundColor: getNameColor(name) }}
      aria-hidden="true"
    >
      {letters}
    </div>
  );
}

export function AttendanceCard({
  attendance,
  variant,
  onConfirm,
  isConfirming = false,
  isSelected = false,
  onToggleSelect,
  disabled = false,
}: AttendanceCardProps) {
  const { user } = attendance.student;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: isConfirming ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-1.5 transition-colors",
        variant === "pending"
          ? cn("hover:bg-muted/50", isSelected && "bg-muted/50")
          : "opacity-50"
      )}
    >
      {variant === "pending" && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          disabled={disabled}
          aria-label={`Sélectionner ${fullName}`}
          className="size-3.5 shrink-0"
        />
      )}

      <Initials name={fullName || "?"} />

      <div className="flex flex-1 items-baseline justify-between gap-2 min-w-0">
        <span className="text-[13px] text-foreground truncate">{fullName}</span>
        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
          {formatDate(attendance.recordedAt, "TIME_SEC")}
        </span>
      </div>

      {variant === "pending" ? (
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2.5 text-[11px] font-medium text-muted-foreground shrink-0"
          onClick={onConfirm}
          disabled={disabled || isConfirming}
          aria-label={`Confirmer la présence de ${fullName}`}
        >
          {isConfirming ? <Loader2 className="size-3 animate-spin" /> : "Confirmer"}
        </Button>
      ) : (
        <CheckCheck
          className="size-3.5 text-emerald-500 dark:text-emerald-400 shrink-0"
          aria-label="Présence confirmée"
        />
      )}
    </motion.div>
  );
}
