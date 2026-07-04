FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholders for Next.js static analysis (runtime values come from compose)
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/heavyjungle
ENV REDIS_URL=redis://redis:6379
ENV S3_ENDPOINT=http://minio:9000
ENV S3_REGION=us-east-1
ENV S3_ACCESS_KEY_ID=build-placeholder
ENV S3_SECRET_ACCESS_KEY=build-placeholder
ENV S3_BUCKET=uploads
ENV S3_FORCE_PATH_STYLE=true
# NEXT_PUBLIC_* is inlined at build time — pass production URL via compose build.args (S3_PUBLIC_URL)
ARG S3_PUBLIC_URL=http://localhost:9000/uploads
ENV S3_PUBLIC_URL=${S3_PUBLIC_URL}
ENV NEXT_PUBLIC_S3_PUBLIC_URL=${S3_PUBLIC_URL}
ENV APP_URL=http://localhost:3000
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
