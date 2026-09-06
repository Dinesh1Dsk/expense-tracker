export interface Budget {
  id: string
  userId: string
  categoryId: string | null
  month: string
  monthlyLimit: number
  dailyLimit: number | null
  weeklyLimit: number | null
  spent: number
}
