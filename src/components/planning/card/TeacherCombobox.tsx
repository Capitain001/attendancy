"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CourseTeacherItem } from "@/components/users/SelectCourseTeachers";

interface TeacherComboboxProps {
  teachers: CourseTeacherItem[];
  value?: string;
  onChange: (value: string) => void;
}

const AVATAR_COLORS = [
  "oklch(0.52 0.16 256)",
  "oklch(0.53 0.18 25)",
  "oklch(0.50 0.13 162)",
  "oklch(0.50 0.16 300)",
  "oklch(0.52 0.14 43)",
  "oklch(0.52 0.13 232)",
  "oklch(0.50 0.12 190)",
];
function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initialsOf(name: string | null): string {
  if (!name) return "?";
  return (
    name
      .replace(/^(M\.|Mme|Pr\.)\s/, "")
      .split(/[\s-]/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function Avatar({ teacher, size = 20 }: { teacher: CourseTeacherItem; size?: number }) {
  if (teacher.avatar_url) {
    return (
      <img
        src={teacher.avatar_url}
        alt={teacher.name ?? ""}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        background: colorFor(teacher.id),
        width: size,
        height: size,
        fontSize: size * 0.42,
      }}
    >
      {initialsOf(teacher.name)}
    </span>
  );
}

export function TeacherCombobox({ teachers, value, onChange }: TeacherComboboxProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = teachers.find((t) => t.id === value);
  const filtered = useMemo(
    () =>
      teachers.filter((t) =>
        `${t.name ?? ""} ${t.email ?? ""}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [teachers, q],
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div className="flex h-9 items-center gap-2 rounded-lg border bg-background px-2.5">
        {current && <Avatar teacher={current} />}
        <span className={cn("flex-1 truncate text-[13px]", !current && "text-muted-foreground")}>
          {current?.name ?? "Sélectionner un enseignant"}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Changer d'enseignant"
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            open && "bg-accent text-foreground",
          )}
        >
          <Search className="size-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un enseignant…"
              className="h-9 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="max-h-44 overflow-y-auto py-1">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-accent"
              >
                <Avatar teacher={t} />
                <span className="flex-1 truncate">{t.name || "Utilisateur inconnu"}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {t.hours}h
                </span>
                {value === t.id && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-muted-foreground">
                Aucun enseignant trouvé.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
