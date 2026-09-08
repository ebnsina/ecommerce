# syntax=docker/dockerfile:1

# Build and run the shop as a plain Node server. Three stages so the image that
# ships carries no compiler, no dev dependency and no source.
ARG NODE_VERSION=24-alpine

# ── dependencies ──────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
RUN corepack enable
WORKDIR /app
# pnpm-workspace.yaml carries the build-script approvals and .npmrc the engine
# policy; without them the install refuses to run esbuild's postinstall.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Cached across builds: the slowest step, and it only changes when the lockfile
# does.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

# ── build ─────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# SvelteKit reads $env/dynamic/private at runtime, so nothing secret is needed
# here — the build must not depend on a database being reachable either.
RUN pnpm build
# CI=true so pnpm prunes without stopping to ask about purging node_modules.
RUN CI=true pnpm prune --prod

# ── tools ─────────────────────────────────────────────────────────────────────
# Schema pushes and seeding need drizzle-kit and the TypeScript sources, which
# the runtime image deliberately does not carry. Run with:
#   docker compose run --rm tools pnpm db:push
FROM node:${NODE_VERSION} AS tools
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "db:push"]

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Uploads land here when STORAGE_DRIVER=local. Mount a volume over it, or use
# an S3-compatible bucket — a container filesystem does not survive a redeploy.
RUN mkdir -p /app/static/uploads && chown -R node:node /app

COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json server.js ./

# Never root: a compromised Node process should not own the filesystem.
USER node
EXPOSE 3000

# The app answers on /, which is enough to know the server and its database
# handler came up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
