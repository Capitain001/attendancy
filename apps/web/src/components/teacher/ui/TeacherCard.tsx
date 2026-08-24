import { RessourceCard } from "@/components/design"
import { UserInfoPopover } from "@/components/users/UserInfoPopover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"


function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "N/A"
  try {
    return format(new Date(date), "dd MMM yyyy", { locale: fr })
  } catch {
    return "Invalide"
  }
}

type TeacherCardProps = {
  teacher: {
    id: string
    name: string
    email: string
    avatar_url?: string
    subject: string
    department: string
    joinedAt: Date
    isAvailable: boolean
  }
}
export default function TeacherCard({ teacher }: TeacherCardProps) {
  return (

      <div className="rounded-md max-w-full bg-background p-px h-fit border-2 border-card transition-all duration-300 space-y-2 hover:shadow-glass">

      <div className="p-4 py-6 space-y-2 rounded-sm border bg-muted">
        {/* Titre + Avatar */}
        <div className="flex items-center gap-2 ">
          <UserInfoPopover
            avatarUrl={teacher.avatar_url}
            name={teacher.name}
            email={teacher.email}
          />
          <h3 className="text-sm font-medium text-foreground truncate">
            {teacher.name}
          </h3>
        </div>
        {/* Matière + Département */}
        <div className="text-xs  flex flex-col text-muted-foreground space-y-1 ">
          <p>
            Matière :{" "}
            <span className="text-foreground font-medium">
              {teacher.subject} 
            </span>
            +3
          </p>
          <p>
            Département :{" "}
            <span className="text-foreground font-medium">
              {teacher.department}
            </span>
          </p>
        </div>
     


      </div>
      </div>

  )
}
