export interface InviteDirectionParams {
  email: string
  name?: string
  functions: string[]
  expiresInDays?: 1 | 3 | 7 | 14 | 30
}
