# Release Checklist

## Pre-release
- [ ] `pnpm install` succeeds in clean environment
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run test` passes
- [ ] `pnpm run db:generate` and `pnpm run db:migrate` validated in staging
- [ ] `pnpm run db:seed` executed for system categories

## Environment
- [ ] API env variables configured (`DATABASE_URL`, `JWT_SECRET`)
- [ ] Mobile env variable configured (`EXPO_PUBLIC_API_URL`)
- [ ] Notification permissions and behavior verified on device

## UAT flows
- [ ] Register/login/logout
- [ ] Account create/update/archive/reorder
- [ ] Transaction create/filter/reverse/transfer
- [ ] Budget create/update and monthly stats
- [ ] Salary create/list
- [ ] Upcoming payment create/mark-paid/recurrence
- [ ] Family create/invite/join/dashboard
- [ ] Reports monthly/category summary
- [ ] Goals create/update progress

## Deployment
- [ ] Render API + Postgres created (see [RENDER.md](RENDER.md))
- [ ] Production env set: `NODE_ENV`, internal `DATABASE_URL`, strong `JWT_SECRET`
- [ ] Migrations applied on production DB (Blueprint pre-deploy does this)
- [ ] Seed script run if required (idempotent; pre-deploy also runs it)
- [ ] API health endpoint validated (`GET /health`)
- [ ] Mobile `EXPO_PUBLIC_API_URL=https://<service>.onrender.com/api/v1`
- [ ] Mobile build generated and smoke-tested

## Post-release
- [ ] Monitor API error rate
- [ ] Monitor auth failures
- [ ] Monitor notification delivery feedback
