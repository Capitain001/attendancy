"use client"

import { useFicheNavigation } from "./hooks/use-fiche-navigation"
import type { Period } from "./types"
import { ClassDetailView, type ClassDetailData } from "./views/class-detail-view"
import { ClassesView, type ClassesData } from "./views/classes-view"
import { HomeView, type HomeData } from "./views/home-view"
import { JustificationsView, type JustificationsData } from "./views/justifications-view"
import { OwnAttendanceView, type OwnAttendanceData } from "./views/own-attendance-view"
import { SessionsView, type SessionsData } from "./views/sessions-view"

export type TeacherAttendanceFicheProps = {
    period: Period
    home: HomeData
    sessions: SessionsData
    classes: ClassesData
    classDetail: ClassDetailData
    ownAttendance: OwnAttendanceData
    justifications: JustificationsData
    onSelectClass?: (classId: string) => void
    onTakeCall?: () => void
    onExportClass?: () => void
    onExportOwnAttendance?: () => void
    onAcceptJustifications?: () => void
    onRefuseJustifications?: () => void
}

export function TeacherAttendanceFiche(props: TeacherAttendanceFicheProps) {
    const { view, go } = useFicheNavigation()

    return (
        <main className="min-h-dvh p-2 font-serif text-foreground sm:py-6">
            <div className="mx-auto max-w-160 border border-foreground p-1">
                <div className="border border-border px-3.5 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-6">
                    {view === "home" && <HomeView go={go} data={props.home} period={props.period} />}
                    {view === "seances" && (
                        <SessionsView go={go} data={props.sessions} onTakeCall={props.onTakeCall} />
                    )}
                    {view === "classes" && (
                        <ClassesView
                            go={go}
                            data={props.classes}
                            period={props.period}
                            onSelect={(classId) => {
                                props.onSelectClass?.(classId)
                                go("classe")
                            }}
                        />
                    )}
                    {view === "classe" && (
                        <ClassDetailView go={go} data={props.classDetail} period={props.period} onExport={props.onExportClass} />
                    )}
                    {view === "assiduite" && (
                        <OwnAttendanceView go={go} data={props.ownAttendance} period={props.period} onExport={props.onExportOwnAttendance} />
                    )}
                    {view === "justifs" && (
                        <JustificationsView
                            go={go}
                            data={props.justifications}
                            onAccept={props.onAcceptJustifications}
                            onRefuse={props.onRefuseJustifications}
                        />
                    )}
                </div>
            </div>
        </main>
    )
}

export default TeacherAttendanceFiche
