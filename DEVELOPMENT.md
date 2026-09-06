# Development Runbook

## Prerequisites
- Node 20+
- `pnpm` 10+

V1 mobile is **offline-only**. No API, Docker, or `EXPO_PUBLIC_API_URL` is required.

## First-time setup
```bash
pnpm install
```

## Start development
```bash
pnpm run dev
```

Opens Expo. On first launch enter your name, then add accounts.

The API package remains in the repo for a later sync backend:
```bash
pnpm run dev:api
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

## Production (Play Store)

V1 ships as an offline Android App Bundle. EAS login, `eas init`, and `eas build -p android --profile production` are in [docs/PLAY_STORE.md](docs/PLAY_STORE.md).

## Production (Render)

Deploy steps, env vars, health check, and mobile `EXPO_PUBLIC_API_URL` are in [docs/RENDER.md](docs/RENDER.md).
Do not reuse the local Docker Postgres (or any other app’s DB) for production.
