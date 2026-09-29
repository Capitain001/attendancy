# DOCUMENTATION : TESTS DE VALIDATION RPC (TAURI / API)

Ce document récapitule la procédure de test et de validation de l'endpoint générique /api/rpc/[action].

1. DESCRIPTION DU SCRIPT (apps/web/scripts/test/rpc/test-rpc.mjs)

---

Le script test-rpc.mjs simule un client lourd (ex: Tauri) et exécute 4 scénarios de test de sécurité et d'authentification :

1. Token valide (200) : Authentification réussie via Supabase, appel avec en-tête Authorization: Bearer .
2. Signature altérée (401) : Modification d'un caractère de la signature du JWT pour vérifier le rejet par getClaims().
3. Sans en-tête (401) : Absence d'en-tête Authorization pour valider la guard condition de la route.
4. Action inconnue (404) : Appel d'une méthode absente de la liste blanche ACTIONS.
5. COMMANDES D'EXÉCUTION

---

PowerShell (depuis la racine du monorepo ou du projet) :

$env:TEST_EMAIL="teacher@gmail.com"; $env:TEST_PASSWORD="12345678"
node --env-file=.env apps/web/scripts/test/rpc/test-rpc.mjs

PowerShell (si tu es déjà positionné dans apps/web) :
$env:TEST_EMAIL="teacher@gmail.com"; $env:TEST_PASSWORD="12345678"
node --env-file=.env scripts/test/rpc/test-rpc.mjs

Bash / Zsh (Linux / macOS / Git Bash) :
TEST_EMAIL="teacher@gmail.com" TEST_PASSWORD="12345678" node --env-file=.env apps/web/scripts/test/rpc/test-rpc.mjs

3. VARIABLES D'ENVIRONNEMENT CONFIGURABLES

---

* TEST_EMAIL (Requis) : Email d'un utilisateur de test Supabase Auth
* TEST_PASSWORD (Requis) : Mot de passe du compte de test
* API_URL (Défaut: http://localhost:3000) : URL de l'API Next.js
* RPC_ACTION (Défaut: getClassesAction) : Action RPC à tester pour le cas 200
* RPC_BODY (Défaut: {}) : Payload JSON envoyé à l'action

4. SORTIE ATTENDUE (RÉSULTAT VALIDÉ)

---

OK   Token valide         attendu 200, reçu 200  {"data":[{"id":"f9005631-ed0b-42a9-8637-bf816dc196f2","name":"GL2","level":"L2"...}]}
OK   Signature altérée    attendu 401, reçu 401  {"error":"Not authenticated, please login first."}
OK   Sans en-tête         attendu 401, reçu 401  {"error":"Not authenticated, please login first."}
OK   Action inconnue      attendu 404, reçu 404  {"error":"Action inconnue"}