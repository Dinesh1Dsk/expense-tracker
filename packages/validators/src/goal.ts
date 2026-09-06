import { z } from 'zod'
export const CreateGoalSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['emergency_fund', 'goal']),
  targetAmount: z.number().int().positive(),
  deadline: z.string().datetime().optional(),
  accountId: z.string().uuid().optional(),
})
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>

export const UpdateGoalProgressSchema = z.object({
  savedAmount: z.number().int().min(0),
})
export type UpdateGoalProgressInput = z.infer<typeof UpdateGoalProgressSchema>
