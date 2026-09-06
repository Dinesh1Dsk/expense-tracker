# Build from the monorepo root:
#   docker build -f apps/api/Dockerfile .
FROM node:20-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/validators/package.json ./packages/validators/package.json

# Install API + workspace deps (including drizzle-kit / tsx for migrate + seed).
# Do not set NODE_ENV=production before this step or pnpm will omit devDependencies.
RUN pnpm install --frozen-lockfile --filter @expense-tracker/api...

COPY apps/api ./apps/api
COPY packages/types ./packages/types
COPY packages/validators ./packages/validators

RUN pnpm --filter @expense-tracker/api build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "--filter", "@expense-tracker/api", "start"]
