import { z } from 'zod'
export const CreateTransactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.number().int().positive(),
  type: z.enum(['DEBIT', 'CREDIT']),
  note: z.string().max(200).optional(),
  transactedAt: z.string().datetime(),
})
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>

export const TransferTransactionSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().int().positive(),
  note: z.string().max(200).optional(),
  transactedAt: z.string().datetime(),
})
export type TransferTransactionInput = z.infer<typeof TransferTransactionSchema>
