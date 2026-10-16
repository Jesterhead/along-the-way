# along-the-way

A small web app that works as a shareable digital personal journal. Write posts, add photos and links, and share your journal with others.

**Stack:** TypeScript · React (Vite) · Apollo GraphQL · Node.js (Express) · Prisma · PostgreSQL · Docker

## Prerequisites

- [Node.js](https://nodejs.org/) 22.12+ (24 LTS recommended; see `.nvmrc`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or another Docker engine with Compose v2

## Quick start: run everything in Docker

```bash
docker compose up --build
```

Open <http://localhost:8080>. Compose starts Postgres, applies migrations, seeds a local user and journal, then starts the API and web app.

Stop it with `docker compose down`. Add `-v` to also delete the database.

## Development: hot reload

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run dev
```

Open <http://localhost:5173>. `npm run dev` starts Postgres in Docker, applies migrations, seeds the database, then runs the API and web app locally with hot reload.

| Service     | Dev URL                              | Docker URL                    |
| ----------- | ------------------------------------ | ----------------------------- |
| Web app     | http://localhost:5173                | http://localhost:8080         |
| GraphQL API | http://localhost:4000/graphql        | http://localhost:8080/graphql |
| Postgres    | `localhost:5433` (user/pass `along`) | same                          |

Postgres listens on host port **5433** so it doesn't clash with a Postgres already installed on 5432.

## Scripts

Run from the repo root:

| Command              | What it does                                                     |
| -------------------- | ---------------------------------------------------------------- |
| `npm run dev`        | Start DB, migrate, seed, run API and web with hot reload         |
| `npm test`           | Run all tests (Vitest)                                           |
| `npm run typecheck`  | Type-check both apps                                             |
| `npm run lint`       | Lint with ESLint                                                 |
| `npm run format`     | Format with Prettier                                             |
| `npm run build`      | Production build of both apps                                    |
| `npm run generate`   | Regenerate the Prisma client and GraphQL types (runs on install) |
| `npm run db:migrate` | Create and apply a migration after editing `schema.prisma`       |
| `npm run db:seed`    | Seed the local user and journal (idempotent)                     |
| `npm run db:reset`   | Drop the database, reapply all migrations, and reseed            |
| `npm run db:down`    | Stop the Docker containers                                       |

## Project layout

```
apps/
  api/                 Node + Express + Apollo Server + Prisma
    prisma/            schema.prisma, migrations, seed
    src/schema.graphql GraphQL schema (source of truth for API types)
    src/generated/     Generated Prisma client + resolver types (git-ignored)
  web/                 React + Vite + Apollo Client
    src/gql/           Generated typed GraphQL documents (git-ignored)
docker-compose.yml     db → migrate (one-shot) → api → web (nginx)
```

### How the types flow

1. `apps/api/prisma/schema.prisma` defines the database. `prisma generate` produces a typed client.
2. `apps/api/src/schema.graphql` defines the API. GraphQL Code Generator produces typed resolvers for the API and typed queries and hooks for the web app.
3. When you change either schema, run `npm run generate`. TypeScript then flags anything that's out of sync.
