---
name: expense-tracker-cursor
description: Use this skill for feature implementation, debugging, and refactoring work in the expense-tracker monorepo, including API routes, React Native screens, DB queries, balance calculations, notifications, and module implementation for accounts, transactions, budget, salary, upcoming-payments, family, reports, and goals.
---

# Expense Tracker Cursor Skill

Use this skill before implementing features in this repository.

## Project Map

- Monorepo: `Turborepo + pnpm workspaces`
- Backend: `apps/api` (`Hono + Drizzle + PostgreSQL`)
- Mobile: `apps/mobile` (`Expo + Expo Router + Zustand`)
- Shared: `packages/types`, `packages/validators`

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm run dev
```

Fill `DATABASE_URL` and `JWT_SECRET` in `apps/api/.env`.

## Non-negotiable Rules

1. Money uses integer paise only. Never use float money values.
2. Transactions are append-only. Never update or delete transaction rows.
3. Balance is recalculated from ledger. Do not persist computed balance.
4. Available balance = current balance - pending upcoming payments.
5. API returns paise values; mobile formats for INR display.
6. API local imports must use `.js` extension (NodeNext).
7. Validation schemas belong in `packages/validators`, not inline in routers.

## API Conventions

- Base path: `/api/v1`
- All non-auth routes require `authMiddleware`
- Read authenticated user from `c.get('userId')`
- Error response shape: `{ error: string }`

## Working Order

Implement in this order when bootstrapping:

1. Accounts
2. Categories seed
3. Transactions
4. Budget
5. Salary
6. Upcoming payments
7. Family
8. Reports
9. Goals
10. Notifications

## Cursor Workflow

1. Implement backend module first.
2. Add/update validators and exports.
3. Add mobile store and API integration.
4. Add/update screen.
5. Run required checks.

## Troubleshooting Quick Fixes

- Expo Go device testing must use LAN API URL in `apps/mobile/.env`:
  - `EXPO_PUBLIC_API_URL=http://<your-mac-lan-ip>:3000/api/v1`
- If auth fails with database errors, run:
  - `pnpm run db:generate`
  - `pnpm run db:migrate`
- Root database scripts target API package via:
  - `--filter=@expense-tracker/api`

## References

- Module patterns and route examples: [references/module-patterns.md](references/module-patterns.md)
- Cursor rules content: [references/cursorrules.md](references/cursorrules.md)
