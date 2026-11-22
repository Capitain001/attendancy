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