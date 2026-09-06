import { db } from '../db/client.js'
import { transactions, accounts, upcomingPayments } from '../db/schema.js'
import { eq, and, lte, sql, inArray } from 'drizzle-orm'

/** Balance = openingBalance + SUM(CREDIT) - SUM(DEBIT) from append-only ledger */
export async function getAccountBalance(accountId: string, asOf?: Date): Promise<number> {
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) })
  if (!account) throw new Error('Account not found')

  const conditions = [eq(transactions.accountId, accountId)]
  if (asOf) conditions.push(lte(transactions.transactedAt, asOf))

  const result = await db
    .select({
      net: sql<string>`COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END), 0)`,
    })
    .from(transactions)
    .where(and(...conditions))

  return account.openingBalance + Number(result[0]?.net ?? 0)
}

/**
 * Available balance = current balance minus all pending upcoming payments.
 * This is the "safe to spend" amount — core to our forecasting feature.
 */
export async function getAvailableBalance(userId: string, accountId: string) {
  const currentBalance = await getAccountBalance(accountId)

  const pending = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(upcomingPayments)
    .where(
      and(
        eq(upcomingPayments.userId, userId),
        eq(upcomingPayments.accountId, accountId),
        inArray(upcomingPayments.status, ['pending', 'overdue'])
      )
    )

  const pendingUpcoming = Number(pending[0]?.total ?? 0)
  return { currentBalance, pendingUpcoming, availableBalance: currentBalance - pendingUpcoming }
}
