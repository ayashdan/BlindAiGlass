# Container image for the Cloud Run deploy path.
# (Firebase App Hosting does NOT need this file — it builds Next.js for you.)

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values must be present at BUILD time (they get baked into the
# browser bundle). Pass them in with --build-arg (see DEPLOY-GCP.md).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV DOCKER_BUILD=1

RUN npm run build

# ---- Run stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run tells the app which port to listen on via PORT (defaults to 8080).
ENV PORT=8080

# Copy only what the standalone server needs (small image).
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080
CMD ["node", "server.js"]
