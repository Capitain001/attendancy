import { CircleUser, ClockIcon } from "lucide-react"

interface InfoCardProps {
  nom?: string
  email?: string
  role?: string
  filiere?: string
  note?: number
}

export  function InfoCard({
  nom ,
  email ,
  role ,
  filiere ,
  note
}: InfoCardProps) {
  return (
    <div className="absolute -translate-y-12 -z-20 cursor-none bg-accent/50 dark:bg-white rotate-6 min-w-52 min-h-36 rounded-xl border-4 p-4">
      <div className="flex flex-col gap-y-8">
        {/* En-tête avec nom et icône */}
        <span className="flex gap-x-4 justify-between">
          <span className="flex gap-x-2">
            <CircleUser />
            <h1 className="skeleton-text min-w-16">{nom}</h1>
          </span>
          <ClockIcon size={20}  />
        </span>

        {/* Infos utilisateur */}
        <div className="flex flex-row gap-x-4 justify-between cursor-none">
          <div className="flex flex-col gap-y-2 text-xs">
            <p className="truncate flex-wrap skeleton-text px-2 min-w-28 "> <span className="px-2 opacity-0"> Email:</span>  {email}</p>
            <p className="truncate flex-wrap skeleton-text min-w-12">Rôle: {role}</p>
            <p className="truncate flex flex-wrap skeleton-text min-w-28">Filière: {filiere}</p>
          </div>

          {/* Présence */}
          <div className="text-xs space-y-3 font-thin">
            <p className="skeleton-text min-w-16">Présence</p>
            <p className="skeleton-text text-end w-fit">{note}/20</p>
          </div>
        </div>
      </div>
    </div>
  )
}

