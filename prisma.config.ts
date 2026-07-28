// prisma.config.ts
// Config Prisma v7 multi-schema : les modèles sont découpés en plusieurs
// fichiers .prisma sous prisma/schemas/ — un fichier par domaine métier.
// Voir prisma/schemas/README.md pour les conventions de découpage.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schemas/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL = connexion directe (migrations) ; DATABASE_URL = pooler (runtime)
    url: env("DIRECT_URL"),
  },
});
