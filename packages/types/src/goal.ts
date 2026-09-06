export type GoalType = 'emergency_fund' | 'goal'
export interface SavingsGoal {
  id: string
  userId: string
  name: string
  type: GoalType
  targetAmount: number
  savedAmount: number
  deadline: Date | null
  accountId: string | null
  createdAt: Date
}
