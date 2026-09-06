# Cursor Rules — Expense Tracker

## Project overview

Personal + family finance tracker. React Native (Expo) + Hono API + PostgreSQL + Turborepo monorepo. Target market is India and currency is INR (stored as paise).

## Critical Rules

### Money

- Store all money as integer paise.
- Use `toPaise()`, `toRupees()`, and `formatINR()` utilities.
- Never use floats for money.
- Never store computed balances.

### Transactions

- Never update or delete `transactions`.
- Corrections use reversal rows with `isReversal: true` and `referenceId`.
- Ledger is append-only.

### Imports

- API local imports must include `.js` extension.

### Validation

- Never define inline Zod schemas in routers.
- Add schemas under `packages/validators/src/`.
- Export every schema from `packages/validators/src/index.ts`.

## API Conventions

- Non-auth routes require `authMiddleware`.
- Use `c.get('userId')` after auth.
- Error response: `{ error: string }`.
- Base path: `/api/v1`.

## Mobile Conventions

- Use Expo Router screen structure.
- State lives in `src/stores` via Zustand.
- Use `apiRequest<T>()` from `src/api/client.ts`.
- Always format money with `formatINR(paise)`.

## Balance Logic

- Compute with ledger utilities in `utils/balance.engine.ts`.
- `availableBalance = currentBalance - totalPendingUpcomingPayments`.
- Home UI must show available balance.

## Stack

- Monorepo: Turborepo + pnpm workspaces
- Backend: Hono, Drizzle, PostgreSQL, jose, bcryptjs
- Mobile: Expo, Expo Router, Zustand
- Shared: types + validators packages

## Phase 1 Build Order

1. Accounts
2. Category seed
3. Transactions
4. Budget
5. Salary
6. Upcoming payments
7. Family
8. Reports
9. Goals
10. Notifications
