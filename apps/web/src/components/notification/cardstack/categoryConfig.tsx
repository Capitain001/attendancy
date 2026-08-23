import { User, GraduationCap, AlertTriangle } from "lucide-react"
import type { NotificationCategory } from "./types"

export const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { label: string; emptyLabel: string; icon: typeof User }
> = {
  PERSONNEL: { label: "Personnel", emptyLabel: "personnelle", icon: User },
  ACADEMIQUE: { label: "Académique", emptyLabel: "académique", icon: GraduationCap },
  URGENT: { label: "Urgent", emptyLabel: "urgente", icon: AlertTriangle },
}

export const CATEGORY_ORDER: NotificationCategory[] = ["PERSONNEL", "ACADEMIQUE", "URGENT"]
