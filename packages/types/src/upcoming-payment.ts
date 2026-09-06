export type UpcomingPaymentType = 'one_time' | 'recurring' | 'emi'
export type UpcomingPaymentStatus = 'pending' | 'paid' | 'overdue'
export interface UpcomingPayment {
  id: string
  userId: string
  name: string
  amount: number
  type: UpcomingPaymentType
  dueDate: Date
  status: UpcomingPaymentStatus
  accountId: string | null
  categoryId: string | null
  recurrenceDay: number | null
  emiTotalMonths: number | null
  emiPaidMonths: number | null
  note: string | null
}
