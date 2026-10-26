import { createPersonalClassAction } from './actions' 
//temp apres avoir brancher les type regenerer on utilisera le fichier type 
type CreatePersonalClassInput = Parameters<typeof createPersonalClassAction>[0]

export type PersonalClassType = NonNullable<CreatePersonalClassInput['type']>

export async function createPersonalClassFormAction(type: PersonalClassType, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  return createPersonalClassAction({ name, type })
}