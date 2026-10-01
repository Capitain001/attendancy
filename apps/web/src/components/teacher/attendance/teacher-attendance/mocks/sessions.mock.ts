import type { SessionsData } from "../views/sessions-view"

export const SESSIONS_MOCK: SessionsData = {
    dateLabel: "Mardi 10 novembre 2026",
    pendingCallTime: "10 h 15",
    today: [
        { id: "s1", course: "Algorithmique", place: "L2 Informatique A · salle A04", time: "08 h 00 – 10 h 00", tag: { text: "Appel clôturé", tone: "ok" }, count: "41 sur 46" },
        { id: "s2", course: "Bases de données", place: "L3 Informatique · salle B12", time: "10 h 15 – 12 h 15", tag: { text: "Appel à faire", tone: "warn" }, count: null },
    ],
    next: [
        { id: "n1", course: "Réseaux", place: "L3 Informatique · salle C02", when: "Mer. 11, 14 h" },
        { id: "n2", course: "Algorithmique", place: "L2 Informatique B · salle A04", when: "Ven. 13, 08 h" },
    ],
}
