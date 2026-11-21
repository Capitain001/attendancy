// Stub client-side pour le module Next.js "server-only".
// Ce fichier est résolu par l'alias Vite dans apps/teacher/vite.config.ts
// lorsqu'un module web importé par transitivité contient `import "server-only"`.
// En production Next.js, ce module lève une erreur à l'import côté client ;
// côté Vite (apps/teacher), on l'intercepte ici pour ne rien faire :
// les "use server" guards sont gérés par le registre RPC, pas par ce module.
