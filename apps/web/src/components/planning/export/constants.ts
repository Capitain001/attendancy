export type Axis = "class" | "group" | "teacher" | "room";
export type Period = "day" | "week" | "month" | "custom";

export const AXIS_LABEL: Record<Axis, string> = {
  class: "Classe entière",
  group: "Groupe",
  teacher: "Enseignant",
  room: "Salle",
};

export const PERIOD_LABEL: Record<Period, string> = {
  day: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  custom: "Plage perso.",
};
