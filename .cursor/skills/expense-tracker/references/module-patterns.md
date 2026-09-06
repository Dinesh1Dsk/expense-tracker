# Module Implementation Patterns

These are reference patterns for module implementation in `apps/api/src/modules`.

## Accounts

- `GET /accounts`: list user accounts and attach computed balances.
- `POST /accounts`: validate input with shared schema and create account.
- `GET /accounts/:id/balance`: return `currentBalance`, `pendingUpcoming`, `availableBalance`.

## Transactions

- `GET /transactions`: support month/account filters.
- `POST /transactions`: create transaction row only.
- `POST /transactions/:id/reverse`: create reversal row (append-only correction path).

## Budget

- `GET /budgets?month=YYYY-MM`: return budgets with computed spent and percent used.
- `POST /budgets`: upsert budget by user+month+category scope.

## Salary

- `GET /salary`: return latest salary config.
- `POST /salary`: compute and store `netAmount` on insert.

## Family

- `POST /family/create`: create family + owner membership.
- `POST /family/join`: join by invite token.
- `GET /family/dashboard`: household members summary.

## Reports

- `GET /reports/monthly`: aggregate income/expense/savings.
- `GET /reports/category`: category-wise expense totals.

## Mobile Store Pattern

- Keep Zustand store per module in `apps/mobile/src/stores`.
- Use `apiRequest<T>()` for calls.
- Keep `isLoading` and optimistic/simple state updates.

## Drizzle Query Guidance

- Prefer Drizzle query builder for CRUD + relations.
- Use SQL aggregates where required.
- Keep API routes/services as the only DB access points.

## Post-schema Change Commands

```bash
pnpm run db:generate
pnpm run db:migrate
```
