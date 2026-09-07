export const MAIN_FUNCTIONS = [
  { name: 'PRINCIPAL', description: "Chef d'établissement, responsable de la gestion globale de l'institution et de la supervision du personnel.", icon: 'principal.svg' },
  { name: 'SECRETARY', description: 'Secrétaire administratif, gestion des dossiers, de la correspondance et des tâches administratives courantes.', icon: 'secretary.svg' },
  { name: 'ASSISTANT', description: 'Assistant administratif, support opérationnel des tâches déléguées par les responsables.', icon: 'assistant.svg' },
  { name: 'DELEGATE', description: "Délégué de classe, représente des élèves en liaison avec l'administration.", icon: 'delegate.svg' },
  { name: 'COORDINATOR', description: 'Coordinateur pédagogique ou Responsable de discipline', icon: 'coordinator.svg' },
  { name: 'MEMBER', description: "Membre de l'administration pédagogique", icon: 'member.svg' },
] as const satisfies readonly { name: string; description: string; icon: string }[]

export type MainFunction = (typeof MAIN_FUNCTIONS)[number]
export type FunctionName = MainFunction['name'] | 'SUPER_ADMIN'

export function isSuperAdmin(fn: FunctionName): boolean {
  return fn === 'SUPER_ADMIN'
}

export const FUNCTIONS = MAIN_FUNCTIONS.reduce(
  (acc, f) => {
    acc[f.name] = f.name
    return acc
  },
  {} as Record<FunctionName, FunctionName>
)