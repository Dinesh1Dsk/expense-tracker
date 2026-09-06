import { z } from 'zod'
export const SetSalarySchema = z.object({
  grossAmount: z.number().int().positive(),
  pfDeduction: z.number().int().min(0).default(0),
  taxDeduction: z.number().int().min(0).default(0),
  otherDeductions: z.number().int().min(0).default(0),
  payDay: z.number().int().min(1).max(31),
  accountId: z.string().uuid(),
  effectiveFrom: z.string().datetime(),
})
export type SetSalaryInput = z.infer<typeof SetSalarySchema>
