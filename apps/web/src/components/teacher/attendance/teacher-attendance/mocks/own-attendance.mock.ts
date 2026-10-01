import type { OwnAttendanceData } from "../views/own-attendance-view"

export const OWN_ATTENDANCE_MOCK: OwnAttendanceData = {
    lateness: { duration: "1 h 15", sessions: 3 },
    absence: { duration: "3 h 00", sessions: 1 },
    madeUp: "3 h 00",
    remaining: "0 h 00",
    unavailabilitiesHref: "#",
    events: [
        { id: "a1", title: "Absence · 3 h 00", detail: "16 oct. · Réseaux, L3", tag: { text: "Rattrapée le 23 oct.", tone: "ok" } },
        { id: "a2", title: "Retard · 0 h 30", detail: "27 oct. · Algorithmique, L2 A", tag: { text: "Sans suite", tone: "neutral" } },
        { id: "a3", title: "Retard · 0 h 25", detail: "29 oct. · Bases de données, L3", tag: { text: "Sans suite", tone: "neutral" } },
        { id: "a4", title: "Retard · 0 h 20", detail: "5 nov. · Algorithmique, L2 B", tag: { text: "Sans suite", tone: "neutral" } },
    ],
}
