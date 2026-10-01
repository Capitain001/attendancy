import type { HomeData } from "../views/home-view"

export const HOME_MOCK: HomeData = {
    teacherName: "Dr Améyo Kpodar",
    classCount: 4,
    courseCount: 3,
    averageRate: 87,
    menu: [
        { view: "seances", title: "Mes séances", summary: "Dernière séance à 10 h 15." },
        { view: "classes", title: "Mes classes", summary: "6 étudiants problématiques." },
        { view: "assiduite", title: "Mon assiduité", summary: "1 h 15 de retard et 3 h d’absence sur la période." },
        { view: "justifs", title: "Justificatifs", alert: "5 demandes", summary: "en attente de décision." },
    ],
}
