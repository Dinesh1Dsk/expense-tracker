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
- [ ] Migrations applied on production DB
- [ ] Seed script run if required
- [ ] API health endpoint validated
- [ ] Mobile build generated and smoke-tested

## Post-release
- [ ] Monitor API error rate
- [ ] Monitor auth failures
- [ ] Monitor notification delivery feedback
