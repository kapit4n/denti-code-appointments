# Tech Stack

| Layer              | Technology                              |
|--------------------|-----------------------------------------|
| Runtime            | Node.js                                 |
| Language           | TypeScript (compiled via `tsc`)         |
| Web Framework      | Fastify v5.3.3                          |
| ORM                | Prisma v6.8.2                           |
| Schema Validation  | fluent-json-schema v6.0.0               |
| Logging            | Pino (pino-pretty for dev)             |
| Dev Runner         | nodemon + ts-node                       |
| Database           | SQLite (dev) / PostgreSQL (production)  |
| Package Manager    | npm                                     |

## Key Dependencies

| Package               | Purpose                                 |
|-----------------------|-----------------------------------------|
| fastify v5.3.3        | HTTP framework with plugin system       |
| fastify-plugin        | Bypass Fastify encapsulation boundaries |
| @prisma/client v6.8.2 | Type-safe database client               |
| prisma v6.8.2         | Schema management, migrations, studio   |
| fluent-json-schema    | Fluent API for JSON Schema generation   |
| dotenv                | Environment variable loading            |
| nodemon               | Auto-restart during development         |
| pino-pretty           | Human-readable log output (dev)         |
| ts-node               | TypeScript execution without precompilation |

## Scripts

| Command               | Description                     |
|-----------------------|---------------------------------|
| `npm run dev`         | Start dev server with nodemon   |
| `npm run build`       | Compile TypeScript to dist/     |
| `npm start`           | Run compiled server             |
| `prisma:generate`     | Regenerate Prisma client        |
| `prisma:migrate`      | Run development migrations      |
| `prisma:studio`       | Open Prisma Studio UI           |

## Environment Variables

| Variable                    | Default                       | Description                              |
|-----------------------------|-------------------------------|------------------------------------------|
| `DATABASE_URL`              | `file:./dev.db`               | Prisma database connection string        |
| `PORT`                      | `3003`                        | HTTP server port                         |
| `PATIENT_SERVICE_URL`       | `http://127.0.0.1:3001`       | Patient Management Service base URL      |
| `CLINIC_PROVIDER_BASE_URL`  | `http://127.0.0.1:3002`       | Clinic & Provider Management base URL    |
| `INVENTORY_CONSULTORY_ID`   | `1`                           | Default consultory ID for inventory sync |
| `INVENTORY_SYNC_ENABLED`    | `true`                        | Toggle inventory HTTP sync               |

## External Services

- **Patient Management Service** (port 3001) — resolves patient identity via `x-user-email` header
- **Clinic & Provider Management Service** (port 3002) — manages procedure catalog, provider records, and inventory
