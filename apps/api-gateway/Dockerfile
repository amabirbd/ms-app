FROM node:22.17.1-alpine AS build
RUN corepack enable
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api-gateway ./apps/api-gateway
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @b2b/api-gateway... build

FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /workspace/apps/api-gateway/dist ./dist
COPY --from=build /workspace/node_modules ./node_modules
EXPOSE 4000
CMD ["dist/main.js"]
