import type { ClassDetailData } from "../views/class-detail-view"

export const CLASS_DETAIL_MOCK: ClassDetailData = {
    name: "L2 Informatique A",
    course: "Algorithmique",
    sessionsHeld: 7,
    averageRate: 89,
    absences: { total: 52, justified: 19 },
    lateness: { count: 31, duration: "6 h 10" },
    studentsHref: "#",
    watched: [
        { id: "e1", name: "Adjovi Mensah", detail: "4 absences · 2 retards", tag: { text: "Seuil dépassé", tone: "warn" } },
        { id: "e2", name: "Koffi Amegan", detail: "3 absences · 5 retards", tag: { text: "Seuil dépassé", tone: "warn" } },
        { id: "e3", name: "Essi Tchalim", detail: "2 absences · 1 retard", tag: { text: "Proche du seuil", tone: "neutral" } },
    ],
    recentCalls: [
        { id: "r1", dateLabel: "10 nov.", summary: "41 présents, 3 absents" },
        { id: "r2", dateLabel: "6 nov.", summary: "43 présents, 2 absents" },
    ],
}
