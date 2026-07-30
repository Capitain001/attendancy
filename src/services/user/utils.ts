import type { UserInfo } from './types'

export function generateUserInfo(
  user: UserInfo,
  fields: (keyof UserInfo)[],
  overrides?: Partial<UserInfo>,
): Partial<UserInfo> {
  const result: Partial<UserInfo> = {}
  for (const field of fields) {
    if (field in user) {
      (result as Record<string, unknown>)[field] = user[field as keyof UserInfo]
    }
  }
  return { ...result, ...overrides }
}




const firstNames = ["Alice", "Bob", "Clara", "David", "Emma", "Léo"]
const lastNames = ["Martin", "Durand", "Dupont", "Moreau", "Leroy", "Petit"]

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export interface RandomUserData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

/**
 * Génère des données utilisateur aléatoires — pas d'accès DB, ne peut pas échouer.
 * Utilisable pour du seeding (l'appelant fait le `prisma.user.create`),
 * des fixtures de test, ou tout mock nécessitant un profil plausible.
 *
 * @example
 * const data = createRandomUser()
 * await prisma.user.create({ data })
 */
export function createRandomUser(): RandomUserData {
  const firstName = getRandom(firstNames)
  const lastName = getRandom(lastNames)
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@test.com`
  const phone = `+228${Math.floor(90000000 + Math.random() * 9999999)}` // format Togo

  return { firstName, lastName, email, phone }
}