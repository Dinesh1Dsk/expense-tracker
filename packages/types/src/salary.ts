export interface Salary {
  id: string
  userId: string
  grossAmount: number
  pfDeduction: number
  taxDeduction: number
  otherDeductions: number
  netAmount: number
  payDay: number
  accountId: string
  effectiveFrom: Date
}
