import { z } from 'zod'
export const CreateUpcomingPaymentSchema = z
  .object({
    name: z.string().min(1).max(100),
    amount: z.number().int().positive(),
    type: z.enum(['one_time', 'recurring', 'emi']),
    dueDate: z.string().datetime().optional(),
    accountId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    recurrenceDay: z.number().int().min(1).max(31).optional(),
    emiTotalMonths: z.number().int().positive().optional(),
    emiPaidMonths: z.number().int().min(0).optional(),
    note: z.string().max(200).optional(),
  })
  .superRefine((input, ctx) => {
    if (input.type === 'one_time' && !input.dueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due date is required for one-time payments',
        path: ['dueDate'],
      })
    }
    if ((input.type === 'recurring' || input.type === 'emi') && !input.recurrenceDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recurrence day is required for recurring/EMI payments',
        path: ['recurrenceDay'],
      })
    }
    if (input.type === 'emi') {
      if (!input.emiTotalMonths) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total months is required for EMI',
          path: ['emiTotalMonths'],
        })
      }
      if (
        input.emiTotalMonths !== undefined &&
        input.emiPaidMonths !== undefined &&
        input.emiPaidMonths >= input.emiTotalMonths
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Months already paid cannot be >= total months',
          path: ['emiPaidMonths'],
        })
      }
    }
  })
export type CreateUpcomingPaymentInput = z.infer<typeof CreateUpcomingPaymentSchema>
