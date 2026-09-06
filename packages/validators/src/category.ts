import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(30),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  type: z.enum(['expense', 'income', 'both']).optional(),
  parentCategoryId: z.string().uuid().optional(),
})

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(30).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>
