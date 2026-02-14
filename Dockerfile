# syntax=docker/dockerfile:1.5

FROM node:24.11.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --------------------
# deps (prod)
# --------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
# (workspace면 pnpm-workspace.yaml도 같이 COPY)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# --------------------
# deps (dev)
# --------------------
FROM base AS dev-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# --------------------
# build
# --------------------
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# --------------------
# dev runtime
# --------------------
FROM base AS dev
ENV NODE_ENV=development
COPY --from=dev-deps /app/node_modules /app/node_modules
COPY . .
CMD ["pnpm", "start:dev"]

# --------------------
# prod runtime
# --------------------
FROM base AS prod
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

CMD ["node", "dist/main"]
