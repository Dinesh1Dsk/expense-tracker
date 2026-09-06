import { z } from 'zod'
export const SetBudgetSchema = z.object({
  categoryId: z.string().uuid().nullable(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  monthlyLimit: z.number().int().positive(),
  dailyLimit: z.number().int().positive().optional(),
  weeklyLimit: z.number().int().positive().optional(),
  isFamily: z.boolean().optional(),
})
export type SetBudgetInput = z.infer<typeof SetBudgetSchema>
