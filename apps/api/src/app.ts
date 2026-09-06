import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { corsAllowlist, env } from './env.js'
import { authRouter } from './modules/auth/auth.router.js'
import { accountsRouter } from './modules/accounts/accounts.router.js'
import { transactionsRouter } from './modules/transactions/transactions.router.js'
import { budgetRouter } from './modules/budget/budget.router.js'
import { salaryRouter } from './modules/salary/salary.router.js'
import { upcomingPaymentsRouter } from './modules/upcoming-payments/upcoming-payments.router.js'
import { familyRouter } from './modules/family/family.router.js'
import { reportsRouter } from './modules/reports/reports.router.js'
import { goalsRouter } from './modules/goals/goals.router.js'
import { categoriesRouter } from './modules/categories/categories.router.js'

export const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = corsAllowlist()

      if (env.NODE_ENV !== 'production') {
        return origin || '*'
      }

      if (allowed.includes('*')) {
        return origin || '*'
      }

      // Expo / React Native typically send no Origin; CORS is browser-only.
      if (!origin) {
        return '*'
      }

      return allowed.includes(origin) ? origin : ''
    },
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  })
)

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

const api = app.basePath('/api/v1')
api.route('/auth', authRouter)
api.route('/accounts', accountsRouter)
api.route('/transactions', transactionsRouter)
api.route('/budgets', budgetRouter)
api.route('/salary', salaryRouter)
api.route('/upcoming-payments', upcomingPaymentsRouter)
api.route('/family', familyRouter)
api.route('/reports', reportsRouter)
api.route('/goals', goalsRouter)
api.route('/categories', categoriesRouter)

export type AppType = typeof api
