import type { ClassesData } from "../views/classes-view"

export const CLASSES_MOCK: ClassesData = {
    thresholdNote: "Seuil : 20 % d’absences non justifiées.",
    items: [
        { id: "c1", name: "L2 Informatique A", course: "Algorithmique", size: 46, overThreshold: 2, rate: 89 },
        { id: "c2", name: "L2 Informatique B", course: "Algorithmique", size: 44, overThreshold: 3, rate: 84 },
        { id: "c3", name: "L3 Informatique", course: "Bases de données", size: 38, overThreshold: 1, rate: 91 },
        { id: "c4", name: "L3 Informatique", course: "Réseaux", size: 38, overThreshold: 0, rate: 85 },
    ],
}
