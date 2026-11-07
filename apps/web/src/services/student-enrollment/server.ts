import "server-only";

// Sous-ensemble volontaire (pas d'export *) : seule la primitive idempotente
// d'inscription est exposée aux autres modules serveur (ex. acceptation d'invitation).
export { createStudentEnrollmentRaw } from "./database";