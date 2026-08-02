
export const PERMISSIONS: { value: string; label: string }[] = [
    { value: "CREATE:USER", label: "Création d'utilisateur" },
    { value: "READ:COURSE", label: "Lecture de cours" },
    { value: "UPDATE:STUDENT", label: "Modification d'étudiant" },
    { value: "DELETE:USER", label: "Suppression d'utilisateur" },
    { value: "READ:CLASS", label: "Lecture de classe" },
    { value: "UPDATE:CLASS", label: "Modification de classe" },
    { value: "DELETE:CLASS", label: "Suppression de classe" },
    { value: "READ:COURSE", label: "Lecture de cours" },
    { value: "UPDATE:COURSE", label: "Modification de cours" },
    { value: "DELETE:COURSE", label: "Suppression de cours" },
    { value: "READ:SCHEDULE", label: "Lecture de planning" },
    { value: "UPDATE:SCHEDULE", label: "Modification de planning" },
    { value: "DELETE:SCHEDULE", label: "Suppression de planning" },
    { value: "READ:ROOM", label: "Lecture de salle" },
    { value: "UPDATE:ROOM", label: "Modification de salle" },
    { value: "DELETE:ROOM", label: "Suppression de salle" },
    { value: "READ:LOCATION", label: "Lecture de localisation" },
  ];

  export type Permission = typeof PERMISSIONS[number];