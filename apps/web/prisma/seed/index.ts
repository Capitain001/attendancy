// prisma/seed/index.ts
// Orchestrateur de seed — un fichier par domaine, appelés dans l'ordre des
// dépendances FK. Lancer : npm run seed (tsx --env-file=.env prisma/seed/index.ts)
//
// ⚠ À ÉTENDRE PAR PROJET — un import par domaine :
// import { seedOrganizations } from './organizations'
// import { seedUsers } from './users'
//
// async function main() {
//   // Ordre = dépendances FK : org avant users, users avant le reste
//   await seedOrganizations()
//   await seedUsers()
// }
//
// main()
//   .then(() => {
//     console.log('✅ Seed done')
//     process.exit(0)
//   })
//   .catch((e) => {
//     console.error('❌ Seed failed', e)
//     process.exit(1)
//   })

import { defineConfig } from "prisma/config";
import { seedReferentialTogo2022 } from "./referential-togo-2022";

  export default defineConfig({
    migrations: {
      seed: "./referential-togo-2022.ts",
    },
    datasource: {
      url: process.env.DATABASE_URL,
    },
  })

// export {}
