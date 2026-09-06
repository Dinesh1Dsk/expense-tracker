# Development Runbook

## Prerequisites
- Node 20+
- `pnpm` 10+
- Docker running (for local PostgreSQL if using containerized DB)

## First-time setup
```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Set values:
- `apps/api/.env`: `DATABASE_URL`, `JWT_SECRET`
- `apps/mobile/.env`: `EXPO_PUBLIC_API_URL=http://<your-mac-lan-ip>:3000/api/v1`

## Database setup
```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
```

## Start development
```bash
pnpm run dev
```

For Expo cache reset:
```bash
cd apps/mobile
pnpm run dev -- --clear
```

## Common checks
```bash
pnpm run type-check
pnpm run lint
```

## Troubleshooting
- If Expo Go cannot hit API: ensure phone + laptop are on same Wi-Fi and mobile env uses LAN IP, not localhost.
- If DB errors show missing database: create DB first and rerun migrations.
- If Metro shows stale module/runtime errors: stop dev server and restart with `--clear`.

## Production (Render)

Deploy steps, env vars, health check, and mobile `EXPO_PUBLIC_API_URL` are in [docs/RENDER.md](docs/RENDER.md).
Do not reuse the local Docker Postgres (or any other app’s DB) for production.
