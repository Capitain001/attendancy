export interface InviteStudentParams {
  email: string
  firstName?: string
  lastName?: string
  classId: string
  groupIds?: string[]
  parentEmail?: string
  expiresInDays?: 1 | 3 | 7 | 14 | 30
}
