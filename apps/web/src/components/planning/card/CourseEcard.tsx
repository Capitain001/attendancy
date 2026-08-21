"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourseTeacherItem } from "@/components/users/SelectCourseTeachers";
import { Loader1 } from "@/components/loaders/Loader";
import { TeacherCombobox } from "./TeacherCombobox";
import { MiniMonth } from "./MiniMonth";

type Option = { value: string; label: string; disabled?: boolean };

interface CourseECardProps {
  startDate: Date;
  courseId: string;
  courseOptions: Option[];

  startTime: string;
  endTime: string;
  timeOptions: { start: Option[]; end: Option[] };

  roomId: string;
  roomOptions: Option[];

  teacherId: string;
  teacherOptions: CourseTeacherItem[];

  courseDuration: number;
  isCheckingAvailability?: boolean;

  onUpdate: (data: Partial<{
    date: Date;
    courseId: string;
    startTime: string;
    endTime: string;
    roomId: string;
    teacherId: string;
  }>) => void;
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

export function CourseECard({
  startDate: initialDate,
  courseId: initialCourse,
  courseOptions,

  startTime: initialStart,
  endTime: initialEnd,
  timeOptions,

  roomId: initialRoom,
  roomOptions,

  teacherId: initialTeacher,
  teacherOptions,

  isCheckingAvailability,
  onUpdate,
}: CourseECardProps) {
  const [date, setDate] = useState<Date>(initialDate);
  const [view, setView] = useState<"form" | "date">("form");

  return (
    <div className="w-full rounded-sm border bg-card p-5 shadow-lg">
      <AnimatePresence mode="wait" initial={false}>
        {view === "form" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 14 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2">
              <Select defaultValue={initialCourse} onValueChange={(v) => onUpdate({ courseId: v })}>
                <SelectTrigger className="h-auto flex-1 border-0 !bg-transparent !shadow-none px-0 text-lg font-semibold shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="Choisir un cours" />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCheckingAvailability && (
                <Loader1 className="size-5 opacity-70" />
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Row icon={<CalendarDays className="size-4" />}>
                <button
                  type="button"
                  onClick={() => setView("date")}
                  className="h-9 flex-1 rounded-lg border bg-background px-3 text-left text-[13px] capitalize transition-colors hover:bg-accent"
                >
                  {format(date, "eeee d MMMM", { locale: fr })}
                </button>
              </Row>

              <Row icon={<Clock className="size-4" />}>
                <div className="flex flex-1 items-center gap-2">
                  <Select defaultValue={initialStart} onValueChange={(v) => onUpdate({ startTime: v })}>
                    <SelectTrigger className="h-9 flex-1 !bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeOptions.start.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground">→</span>

                  <Select defaultValue={initialEnd} onValueChange={(v) => onUpdate({ endTime: v })}>
                    <SelectTrigger className="h-9 flex-1 !bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeOptions.end.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Row>

              <Row icon={<MapPin className="size-4" />}>
                <Select defaultValue={initialRoom} onValueChange={(v) => onUpdate({ roomId: v })}>
                  <SelectTrigger
                    className={cn("h-9 flex-1 !bg-background", isCheckingAvailability && "animate-pulse opacity-50")}
                  >
                    <SelectValue placeholder="Choisir une salle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>

              <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Enseignant
                </label>
                <TeacherCombobox
                  teachers={teacherOptions}
                  value={initialTeacher}
                  onChange={(v) => onUpdate({ teacherId: v })}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="date"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.18 }}
          >
            <div className="relative mb-4 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setView("form")}
                className="absolute left-0 flex size-8 items-center justify-center rounded-md border bg-background hover:bg-accent"
              >
                <ArrowLeft className="size-4" />
              </button>
              <h3 className="text-sm font-semibold">Sélectionnez la date</h3>
            </div>

            <MiniMonth
              value={date}
              onChange={(d) => {
                setDate(d);
                onUpdate({ date: d });
                setView("form");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
