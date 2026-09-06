import { z } from 'zod'

const AccountTypeSchema = z.enum([
  'cash',
  'bank',
  'wallet',
  'credit_card',
  'savings',
  'loan',
])

export const CreateAccountSchema = z.object({
  name: z.string().min(1).max(50),
  type: AccountTypeSchema,
  openingBalance: z.number().int().min(0).default(0),
  color: z.string().max(20).optional(),
  institutionName: z.string().max(50).optional(),
  creditLimit: z.number().int().positive().optional(),
  outstandingBalance: z.number().int().positive().optional(),
})
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>

export const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().max(20).optional(),
  institutionName: z.string().max(50).optional(),
  creditLimit: z.number().int().positive().optional(),
  outstandingBalance: z.number().int().positive().optional(),
})
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>

export const ReorderAccountsSchema = z.object({
  orderedAccountIds: z.array(z.string().uuid()).min(1),
})
export type ReorderAccountsInput = z.infer<typeof ReorderAccountsSchema>
