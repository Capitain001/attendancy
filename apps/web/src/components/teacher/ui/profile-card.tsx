"use client"

import {
  Mail,
  Phone,
  MessageSquare,
  Video,
  MoreVertical,
  Calendar,
} from "lucide-react"

import { BsFileEarmarkText, BsWhatsapp } from "react-icons/bs"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────

export interface Teacher {
  id: string
  name: string
  title: string
  department: string
  email: string
  phone?: string
  avatarUrl?: string
  status: "online" | "busy" | "away"
}

export interface TeacherSchedule {
  month: string
  sessionCount: number
}

export interface TeacherProfileCardProps {
  teacher: Teacher
  schedule: TeacherSchedule

  onEmail?: () => void
  onCall?: () => void
  onMessage?: () => void
  onVideo?: () => void
  onMore?: () => void

  className?: string
}

// ─── Mock ──────────────────────────────────────────────

export const MOCK_TEACHER: Teacher = {
  id: "t_1",
  name: "Kossi Mensah",
  title: "Professeur de Mathématiques",
  department: "Sciences",
  email: "kossi.mensah@example.com",
  phone: "+228 90 00 00 00",
  avatarUrl: "",
  status: "online",
}

export const MOCK_TEACHER_SCHEDULE: TeacherSchedule = {
  month: "Avril 2026",
  sessionCount: 24,
}

// ─── Helpers ───────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
]

const STATUS_DOT: Record<Teacher["status"], string> = {
  online: "bg-green-500",
  busy: "bg-yellow-400",
  away: "bg-slate-400",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function getAvatarColor(id: string) {
  const hash = id
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)

  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ─── Subcomponents ─────────────────────────────────────

function Avatar({
  teacher,
}: {
  teacher: Teacher
}) {
  return (
    <div className="relative shrink-0">
      {teacher.avatarUrl ? (
        <img
          src={teacher.avatarUrl}
          alt={teacher.name}
          className="size-14 rounded-full object-cover"
        />
      ) : (
        <div
          className={cn(
            "size-14 rounded-full flex items-center justify-center  font-medium",
            getAvatarColor(teacher.id)
          )}
        >
          {getInitials(teacher.name)}
        </div>
      )}

      <span
        className={cn(
          "absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-background",
          STATUS_DOT[teacher.status]
        )}
      />
    </div>
  )
}

function ActionButton({
  onClick,
  children,
}: {
  onClick?: () => void
  children: React.ReactNode
}) {
  if (!onClick) return null

  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full border border-border bg-muted/40 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
    >
      {children}
    </button>
  )
}

// ─── Main Card ─────────────────────────────────────────

export function TeacherProfileCard({
  teacher,
  schedule,
  onEmail,
  onCall,
  onMessage,
  onVideo,
  onMore,
  className,
}: TeacherProfileCardProps) {
  return (
    <div
      className={cn(
        "min-w-[18rem] flex flex-col w-full bg-card border border-border/10 rounded-xl p-5 font-sans gap-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between ">
        <div className="flex items-center gap-3">
          <Avatar teacher={teacher} />

          <div>
            <p className="text-sm font-medium text-foreground">
              {teacher.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {teacher.title}
            </p>

            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              {teacher.department}
            </p>
          </div>
        </div>

        {onMore && (
          <button
            onClick={onMore}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 ">
        <ActionButton onClick={onEmail}>
          <Mail className="w-3.5 h-3.5" />
        </ActionButton>

        <ActionButton onClick={onCall}>
          <Phone className="w-3.5 h-3.5" />
        </ActionButton>

        <ActionButton onClick={onMessage}>
          <BsWhatsapp className="w-3.5 h-3.5" />
        </ActionButton>

        <ActionButton onClick={onVideo}>
          <Video className="w-3.5 h-3.5" />
        </ActionButton>
      </div>

      {/* Schedule row */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2 border border-border rounded-lg px-2.5 py-1.5 flex-1">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-foreground">
            {schedule.month}
          </span>
        </div>

        <div className="flex items-center gap-2 border border-border rounded-lg px-2.5 py-1.5">
          <span className="text-xs text-foreground">
            Data
          </span>
          <BsFileEarmarkText />
        </div>
      </div>
    </div>
    )
}

