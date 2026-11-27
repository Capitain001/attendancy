# commande for operator


claude --dangerously-skip-permissions
#grep
grep -rn "generateTermsFromProgram" src/

relancer bun /pnpm 

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

TEST_EMAIL=prof@test.com TEST_PASSWORD=... node --env-file=.env.local scripts/test-rpc.mjs


delete protected filles
https://claude.ai/chat/8cecbc60-a301-4b6d-bded-8d9e466c1315


## regenerer les contracts :
bun --filter @attendancy/types build:types

## run post migrate
# Depuis la racine du monorepo (inclut maintenant db:sync-types automatiquement)
bun --filter @attendancy/web db:post-migrate

# Ou depuis apps/web/
bun run db:post-migrate

##test unitaire 

# Depuis la racine du monorepo
bun --filter @attendancy/web test:unit -- src/services/permission/utils.unit.test.ts

# Ou depuis apps/web/
bun run test:unit -- src/services/permission/utils.unit.test.ts

bun run test:unit -- src/modules/auth/persmission/acces.unit.test.ts

bun run test:unit -- src/services/function/cache.unit.test.ts

cd apps/chat

# Build production (utilise VITE_API_URL de apps/chat/.env)
# → génère apps/chat/artifacts/Attendancy-Chat.exe
bun run build:desktop

# Build de test local (pointe sur http://localhost:3000 par défaut)
# → génère apps/chat/artifacts/Attendancy-Chat-dev.exe
bun run build:desktop dev

# Avec URL API personnalisée ou installeur NSIS :
bun run build:desktop dev -api:http://192.168.1.20:3000
bun run build:desktop --installer

bun --filter @attendancy/chat run build:desktop dev


# 1. Générer les stubs RPC (packages/rpc/src/generated/*.ts)
bun --filter @attendancy/rpc gen

# 2. Régénérer le contrat de types ApiClient (packages/types/dist/contract.d.mts)
bun --filter @attendancy/types build:types

##path depuis un package ex: ui
bunx tsx apps/web/scripts/generate/path/comment.ts packages/ui/src