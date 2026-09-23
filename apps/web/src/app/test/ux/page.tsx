'use client'

import InvitationFlow from '@/components/auth/signup/flow/invited/InvitationFlow'
import {
  WelcomeStep,
  InvitationStep,
  RoleStep,
  ConfirmStep,
} from '@/components/auth/signup/flow/invited/InvitationSteps'
import MobileNavMenu from '@/components/layout/to-implemente/mobile-navbar'
import { Calendar } from '@/components/ui/calendar-mini'
import type { UserInfo } from '@/types/user'

const mockUser: UserInfo = {
  id: 'usr_mock_001',
  email: 'sarah.diallo@example.com',
  name: 'Sarah Diallo',
  avatar_url: 'https://i.pravatar.cc/150?img=47',
  role: 'TEACHER',
  function: 'ASSISTANT',
  status: 'INVITED',
  invitationToken: 'mock-token-abc123',
  organization: {
    id: 'org_mock_001',
    name: 'Lycée Excelsior',
    slug: 'lycee-excelsior',
    logo: 'https://api.dicebear.com/9.x/initials/svg?seed=Lycee%20Excelsior',
    responsable: false,
  },
  invited_by: {
    name: 'Moussa Kone',
    email: 'moussa.kone@example.com',
  },
}

import { SwipeSheet, SwipeSheetSnapPoint } from '@/components/teacher/planning/SwipeSheet'

import { useState } from "react"
import {
  CheckCircle2,
  Clock,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react"

// Données d'exemple pour la liste d'émargement
const STUDENTS = [
  { id: 1, name: "Thomas Dubois", status: "present", time: "08:55" },
  { id: 2, name: "Camille Martin", status: "present", time: "09:01" },
  { id: 3, name: "Lucas Bernard", status: "late", time: "09:18" },
  { id: 4, name: "Sophie Petit", status: "absent", time: "-" },
  { id: 5, name: "Antoine Moreau", status: "present", time: "08:58" },
]

export default function StudentAttendancePage() {
  const [sheetState, setSheetState] = useState<SwipeSheetSnapPoint>("peek")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStudents = STUDENTS.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const presentCount = STUDENTS.filter((s) => s.status === "present").length

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
      {/* Contenu principal de la page (ex: cours / cours amphi) */}
      <div className="flex max-w-md flex-col items-center text-center pb-20">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Users className="h-6 w-6 text-foreground" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Cours : Algorithmique Avancée
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Master 1 - Amphi B • Prof. Martin
        </p>

        {/* Indication d'état */}
        <div className="mt-6 flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm text-muted-foreground">
          <span>État du panneau :</span>
          <span className="font-mono font-medium text-foreground">
            {sheetState}
          </span>
        </div>
      </div>

      {/*TRIGGER : Déclencheur fixe en bas de page lorsque le sheet est fermé ou minimisé */}
      {sheetState === "closed" && (
        <div className="fixed bottom-6 z-30">
          <button
            type="button"
            onClick={() => setSheetState("peek")}
            className="flex items-center gap-2 rounded-xs border bg-background p-2 text-sm font-medium text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="rounded-xs bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {presentCount}/5 etudiants
            </span>
          </button>
        </div>
      )}

      {/* Composant SwipeSheet avec le contenu de présence */}
      <SwipeSheet
        value={sheetState}
        onValueChange={setSheetState}
        peekHeight={150}
        expandedOffset={80}
      >
        <div className="flex h-full flex-col px-6 pb-6">
          {/* En-tête visible en mode Peek & Expanded */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <UserCheck className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold">5 étudiants</h2>
                <p className="text-xs text-muted-foreground">
                  {presentCount} présents • 1 en retard • 1 absent
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sheetState !== "expanded" ? (
                <button
                  type="button"
                  onClick={() => setSheetState("expanded")}
                  className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Voir tout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSheetState("peek")}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Réduire"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Recherche & Filtres */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border bg-muted/40 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Liste déroulante des étudiants */}
          <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {student.time}
                    </p>
                  </div>
                </div>

                {/* Badges d'état neutres */}
                <div>
                  {student.status === "present" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Présent
                    </span>
                  )}
                  {student.status === "late" && (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> En retard
                    </span>
                  )}
                  {student.status === "absent" && (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground line-through">
                      <UserX className="h-3.5 w-3.5" /> Absent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SwipeSheet>
    </main>
  )
}

// import * as React from "react";
// import { DateRange } from 'react-day-picker'


// export default function Particle() {
//   const [range, setRange] = React.useState<DateRange | undefined>({
//     from: new Date(),
//     to: new Date(new Date().setDate(new Date().getDate() + 7)),
//   });

//   return <Calendar mode="range" onSelect={setRange} selected={range} />;
// }


// export default function Page() {
//   return (
//     // <InvitationFlow
//     //   steps={[
//     //     { key: 'welcome',    render: () => <WelcomeStep    user={mockUser} /> },
//     //     { key: 'invitation', render: () => <InvitationStep user={mockUser} /> },
//     //     { key: 'role',       render: () => <RoleStep       user={mockUser} /> },
//     //   ]}
//     //   confirm={{
//     //     key: 'confirm',
//     //     render: (status) => <ConfirmStep user={mockUser} status={status} />,
//     //   }}
//     //   onAccept={async () => { await new Promise((r) => setTimeout(r, 1500)) }}
//     //   onDecline={async () => { await new Promise((r) => setTimeout(r, 800)) }}
//     // />

//     <div className='min-h-screen'> 
//       	<MobileNavMenu navItems={[{ heading: "Home", href: "/" },]} />

//         <Calendar/>
//        </div>
//   )
// }
