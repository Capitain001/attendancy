import type { JustificationsData } from "../views/justifications-view"

export const JUSTIFICATIONS_MOCK: JustificationsData = {
    pendingCount: 5,
    items: [
        { id: "j1", name: "Adjovi Mensah", detail: "L2 A · absent le 3 nov.", reason: "Maladie", tag: { text: "Certificat", tone: "neutral" } },
        { id: "j2", name: "Koffi Amegan", detail: "L2 A · absent le 27 oct.", reason: "Décès familial", tag: { text: "Attestation", tone: "neutral" } },
        { id: "j3", name: "Essi Tchalim", detail: "L2 B · absente le 4 nov.", reason: "Transport", tag: { text: "Sans pièce", tone: "warn" } },
    ],
}
