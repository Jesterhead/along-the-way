# Build context is the repo root (npm workspaces share one lockfile).

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts
COPY tsconfig.base.json ./
# Codegen reads the API's schema file.
COPY apps/api/src/schema.graphql apps/api/src/
COPY apps/web apps/web
RUN npm run generate -w apps/web && npm run build -w apps/web

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
