# Flux d'Inscription Autonome (`PRINCIPAL` & `PERSONAL`)

Ce document détaille les deux flux où l'utilisateur crée lui-même son compte (par opposition aux utilisateurs invités) :
1. **Flow Fondateur d'établissement (`DIRECTION` / `PRINCIPAL`)** — création d'une organisation `INSTITUTION`.
2. **Flow Indépendant (`PERSONAL`)** — inscription sans organisation initiale, puis création à la demande d'une organisation `PERSONAL` (`TEACHER`, `STUDENT`, `PARENT`) depuis le Web ou l'application Desktop/Mobile (`apps/teacher`).

---

## 1. Flow Fondateur d'Établissement (`DIRECTION` / `PRINCIPAL`)

La direction est le fondateur d'une organisation `INSTITUTION`. Elle s'inscrit, confirme son email, configure son établissement, puis complète son profil civique.

```text
/auth/signup/principal
  └─ signupPrincipalAction()       (apps/web/src/modules/auth/actions/signup.ts)
       ├─ signUpPrincipal()        → Supabase Auth : app_metadata = { role: DIRECTION, function: PRINCIPAL, status: NEW }
       ├─ createUserRecord()       → Prisma User minimal (id, email, status: PENDING, dateOfBirth: null)
       └─ redirect('/auth/check-email?email=...')
            │
            ▼ (Clic sur le lien de confirmation dans l'email)
/auth/callback?code=...
  ├─ exchangeCodeForSession(code)
  ├─ getUserInfo({ cache: false })
  └─ user.function === 'PRINCIPAL' && !user.organization?.id
       │
       ▼
/auth/org/setup
  └─ createOrgAction()             (apps/web/src/services/organization/actions/organization.mutations.ts)
       ├─ createOrgWithDefaults()  → Crée Organization (INSTITUTION) + UserOrganization + Direction + fonctions par défaut
       ├─ setUserAccess()          → app_metadata = { status: ACTIVE, organization: snapshot, organizations: [snapshot] }
       └─ router.push('/auth/redirect')
            │
            ▼
/auth/redirect
  └─ checkUserProfile() === false (dateOfBirth absent)
       │
       ▼
/auth/profile  (ProfileStepper)
  └─ upsertUserProfile()           (apps/web/src/modules/auth/profile/user.ts)
       ├─ Remplit firstName, lastName, sex, dateOfBirth, phone dans prisma.user + user_metadata
       ├─ ensureRoleProfile()      → Garantit l'entité Direction et synchronise directionId dans app_metadata
       └─ redirect('/{orgSlug}/direction')
```

### Fichiers & fonctions clés du flow `PRINCIPAL`

| Étape | Fonction / Route | Fichier |
|---|---|---|
| Page d'inscription | `/auth/signup/principal` | [`apps/web/src/app/auth/signup/principal/page.tsx`](../../../apps/web/src/app/auth/signup/principal/page.tsx) |
| Action d'inscription | `signupPrincipalAction` | [`apps/web/src/modules/auth/actions/signup.ts`](../../../apps/web/src/modules/auth/actions/signup.ts) |
| Création Auth + `app_metadata` | `signUpPrincipal` | [`apps/web/src/modules/auth/supabase.ts`](../../../apps/web/src/modules/auth/supabase.ts) |
| Création ligne `User` minimale | `createUserRecord` | [`apps/web/src/modules/auth/database/user.mutations.ts`](../../../apps/web/src/modules/auth/database/user.mutations.ts) |
| Création de l'établissement | `createOrgAction` | [`apps/web/src/services/organization/actions/organization.mutations.ts`](../../../apps/web/src/services/organization/actions/organization.mutations.ts) |

> **Pourquoi `createOrgAction` n'utilise pas `authAccess()` ?**
> Au moment où le fondateur soumet `/auth/org/setup`, il ne possède pas encore d'`orgId`. Or `authAccess()` rejette tout appel sans `orgId`. `createOrgAction` appelle donc directement `getUserInfo()` suivi de `getAuthorization(user, 'DIRECTION', 'PRINCIPAL')`.

---

## 2. Flow Compte Personnel (`PERSONAL`)

Un utilisateur qui s'inscrit via le parcours personnel crée d'abord un compte **sans rôle ni organisation**. Il choisit ensuite son ou ses rôles (`TEACHER`, `STUDENT`, `PARENT`) dans son espace personnel.

```text
[Web] /auth/signup/personal  ──► signupPersonalAction(formData) ──┐
                                                                  ├──► signupPersonal({ email, password })
[Tauri] /auth/signup/personal ─► signupPersonalDesktopAction() ───┘      ├─ signUpPersonal() → app_metadata = { status: NEW }
        (RPC public sans Bearer)                                         └─ createUserRecord({ id, email })
                                                                               │
                                         ┌─────────────────────────────────────┘
                                         ▼ (Clic lien email → /auth/callback)
                                 redirectUser(user)
                                 (pas d'org active → /auth/org/info)
                                         │
                                         ▼
                                 /auth/org/info
                                 (Carte "Espace personnel" en 1re position)
                                         │
                                         ▼
                        /auth/org/profile?organizationId=personal
                        (Choix du rôle : TEACHER, STUDENT ou PARENT)
                                         │
                                         ▼
                        selectPersonalRoleFormAction(formData)
                          └─ createPersonalOrgAction(role)  (src/features/personal/services/organization)
                               ├─ Si aucune org PERSONAL :
                               │    createPersonalOrgWithProfile({ userId, role, userName })
                               │    + setUserAccess({ status: PENDING, role, organization: snapshot, organizations })
                               ├─ Si org PERSONAL déjà existante :
                               │    createPersonalProfileAction(existingOrgId, role)
                               │    (ajoute le nouveau profileId au snapshot existant)
                               └─ redirect('/auth/redirect')
                                    │
                                    ▼
                              /auth/redirect
                                ├─ Si dateOfBirth absent → /auth/profile (upsertUserProfile + ensureRoleProfile → status: ACTIVE)
                                └─ Sinon → redirectUser(user)
                                     ├─ TEACHER → /personal/{slug}/teacher
                                     └─ STUDENT / PARENT → /{slug}/{role}
```

### Fichiers & fonctions clés du flow `PERSONAL`

| Étape | Fonction / Route | Fichier |
|---|---|---|
| Page d'inscription Web | `/auth/signup/personal` | [`apps/web/src/app/auth/signup/personal/page.tsx`](../../../apps/web/src/app/auth/signup/personal/page.tsx) |
| Page d'inscription Tauri | `/auth/signup/personal` | [`apps/teacher/src/routes/auth/signup/personal.tsx`](../../../apps/teacher/src/routes/auth/signup/personal.tsx) |
| Logique partagée d'inscription | `signupPersonal` / `signupPersonalAction` | [`apps/web/src/modules/auth/actions/signup.ts`](../../../apps/web/src/modules/auth/actions/signup.ts) |
| Exposition RPC publique | `signupPersonalDesktopAction` | [`apps/web/src/services/auth/actions.ts`](../../../apps/web/src/services/auth/actions.ts) |
| Création / extension de l'org `PERSONAL` | `createPersonalOrgAction` / `createPersonalProfileAction` | [`apps/web/src/features/personal/services/organization/actions/organization.mutations.ts`](../../../apps/web/src/features/personal/services/organization/actions/organization.mutations.ts) |

