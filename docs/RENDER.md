# Deploy the API on Render

This repo ships a Blueprint (`render.yaml`) plus a Dockerfile so the pnpm monorepo API (`apps/api` + `packages/types` + `packages/validators`) can build on Render.

No production secrets live in git. Do not reuse a local or shared Postgres (including anything on `localhost:5433`).

Rate limiting is out of scope here. Use Render’s DDoS protection and add an app-level limiter later if you need it.

## What gets created

| Resource | Blueprint name | Notes |
| --- | --- | --- |
| Render Postgres | `expense-tracker-db` | Plan `basic-256mb`, Postgres 16, Singapore, private network only |
| Web service | `expense-tracker-api` | Docker, plan `starter`, health check `/health` |

`starter` stays up (no free-tier spin-down). Change plans in `render.yaml` **before** the first apply if you want something else. Region cannot be changed after create.

## Env vars

| Variable | Required | Set by | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | Blueprint | Must be `production` |
| `DATABASE_URL` | yes | Blueprint `fromDatabase` | Internal Render Postgres URL |
| `JWT_SECRET` | yes | Blueprint `generateValue` | Or paste your own (≥ 32 random chars) |
| `JWT_EXPIRES_IN` | no | Blueprint | Default `7d` |
| `PORT` | yes at runtime | Render | Injected. Bind `0.0.0.0` (already in `index.ts`) |
| `CORS_ORIGIN` | no | Blueprint empty | Comma-separated **browser** origins. Native Expo / React Native do not send `Origin` and keep working if this is empty |

Generate your own JWT secret if you prefer not to use Render’s generated value:

```bash
openssl rand -base64 48
```

## Path A — Blueprint (preferred)

1. Push this repo to GitHub (remote: `Dinesh1Dsk/expense-tracker`).
2. In [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the GitHub repo and apply `render.yaml` from the default branch (`main`).
4. Confirm the web service + Postgres are in the **same region**.
5. Wait for the first deploy. Pre-deploy runs:

   ```text
   pnpm --filter @expense-tracker/api db:migrate && pnpm --filter @expense-tracker/api db:seed
   ```

   Seed is idempotent: it only inserts missing system categories.

6. Open `https://<service>.onrender.com/health` and expect `{ "status": "ok", ... }`.
7. API base path is `/api/v1` (example: `https://<service>.onrender.com/api/v1/auth/login`).

## Path B — Dashboard by hand (no Blueprint)

### 1. Postgres

1. **New** → **PostgreSQL**.
2. Name: `expense-tracker-db` (or similar).
3. Region: pick one and reuse it for the web service (Singapore matches the Blueprint).
4. Plan: at least **Basic 256 MB** (free Postgres is not available for new accounts).
5. After create, copy the **Internal** Database URL (not the External URL).

### 2. Web service

1. **New** → **Web Service** → connect this GitHub repo.
2. Settings:

   | Field | Value |
   | --- | --- |
   | Language / runtime | **Docker** |
   | Root directory | *(leave empty — repo root)* |
   | Dockerfile path | `./apps/api/Dockerfile` |
   | Docker build context | `.` (repo root) |
   | Start command | *(leave empty — uses image `CMD`)* |
   | Pre-deploy command | `pnpm --filter @expense-tracker/api db:migrate && pnpm --filter @expense-tracker/api db:seed` |
   | Health check path | `/health` |
   | Instance | **Starter** (or higher) |

3. Environment:

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | **Internal** URL from the Postgres instance |
   | `JWT_SECRET` | Strong random string, min 32 chars |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | empty, or `https://your-web-origin.example` |

   Do **not** set `PORT` yourself. Render injects it.

### Native Node fallback (if you skip Docker)

Use this only if the Docker build fails. Root directory stays empty.

| Field | Value |
| --- | --- |
| Runtime | Node |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @expense-tracker/api... build` |
| Start command | `pnpm --filter @expense-tracker/api start` |
| Pre-deploy command | `pnpm --filter @expense-tracker/api db:migrate && pnpm --filter @expense-tracker/api db:seed` |
| Health check | `/health` |

## After deploy

### Health and API

```bash
curl https://<service>.onrender.com/health
```

Expect JSON `{ "status": "ok", "ts": "..." }`.

Auth and the rest of the app live under `/api/v1`.

### Seed (if categories are missing)

Pre-deploy already seeds. If you created the service without that command, run once from **Render Shell**:

```bash
pnpm --filter @expense-tracker/api db:seed
```

Safe to re-run. It skips names that already exist.

### Mobile app

In `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=https://<service>.onrender.com/api/v1
```

Restart Expo after changing it.

## Render settings cheat sheet

| Setting | Value |
| --- | --- |
| Dockerfile | `apps/api/Dockerfile` |
| Build context | repository root |
| Image start | `pnpm --filter @expense-tracker/api start` → `node dist/index.js` |
| Health | `GET /health` |
| Pre-deploy | migrate + seed |
| Bind | `0.0.0.0` + `process.env.PORT` |

## Local Docker smoke (optional)

From the repo root (needs a reachable `DATABASE_URL` and a real `JWT_SECRET`):

```bash
docker build -f apps/api/Dockerfile -t expense-tracker-api .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e JWT_SECRET="$JWT_SECRET" \
  expense-tracker-api
```

Do not point `DATABASE_URL` at another project’s database.
