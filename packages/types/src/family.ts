export interface Family {
  id: string
  name: string
  ownerId: string
  inviteToken: string
  createdAt: Date
}
export interface FamilyMember {
  userId: string
  familyId: string
  role: 'owner' | 'member'
  joinedAt: Date
}
