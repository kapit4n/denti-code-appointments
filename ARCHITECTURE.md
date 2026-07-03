# Architecture

## Overview

**denti-code-appointments** is the Appointments & Clinical Records microservice within the denti-code platform. It manages appointment scheduling, performed clinical actions, and inventory synchronization.

## System Context

The service interacts with two companion microservices:

```
┌─────────────────────────┐      ┌─────────────────────────────┐
│  Patient Management     │      │  Clinic & Provider Mgmt     │
│  (port 3001)            │      │  (port 3002)               │
│  - Resolves patient     │      │  - Procedure catalog       │
│    identity via email   │      │  - Inventory management    │
└────────┬────────────────┘      └──────────┬──────────────────┘
         │                                  │
         │  GET /api/patients/me            │  POST /api/v1/inventory/apply-code-deltas
         │  (x-user-email header)           │
         ▼                                  ▼
┌──────────────────────────────────────────────────────────────┐
│              denti-code-appointments (port 3003)             │
│                                                              │
│  Fastify v5 · TypeScript · Prisma · SQLite (dev)            │
└──────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
  server.ts                     # Entry point — loads config, starts Fastify
  app.ts                        # App factory — registers plugins, routes, error handler
  config/
    index.ts                    # Environment variable loader
  plugins/
    prisma.ts                   # Prisma client plugin (decorates Fastify instance)
    errorHandler.ts             # Central error handler (validation, Prisma errors, fallback)
  appointments/
    appointments.routes.ts      # HTTP routes: /api/v1/appointments
    appointments.service.ts     # Business logic for CRUD + RBAC
    appointments.schemas.ts     # JSON schemas (fluent-json-schema)
    patientPatchPolicy.ts       # RBAC rules for patient vs staff updates
    patientProfileClient.ts     # HTTP client to Patient Management Service
  performed-actions/
    performed-actions.routes.ts # HTTP routes: /api/v1/appointments/:id/actions, /api/v1/actions/:id
    performed-actions.service.ts# Business logic for CRUD + inventory sync
    performed-actions.schemas.ts# JSON schemas (fluent-json-schema)
  inventory/
    visitInventorySync.ts       # Delta computation + HTTP sync to clinic-provider
prisma/
  schema.prisma                 # Data model (Appointment 1:N PerformedAction)
  seed.ts                       # Seed data for development
  migrations/                   # Database migrations
```

## Layered Architecture

```
┌─────────────────────────────────────────┐
│  Routes (HTTP concerns)                 │
│  - Parse request params/body/query      │
│  - Delegate to service                  │
│  - Send response                        │
├─────────────────────────────────────────┤
│  Services (Business logic)              │
│  - CRUD operations via Prisma           │
│  - RBAC enforcement                     │
│  - Inventory delta computation          │
├─────────────────────────────────────────┤
│  Plugins (Cross-cutting)                │
│  - Prisma client (decorated on app)     │
│  - Centralized error handling           │
├─────────────────────────────────────────┤
│  Prisma ORM → SQLite (dev) / PG (prod)  │
└─────────────────────────────────────────┘
```

## Database Model

- **Appointment** — stores dental appointment records (PatientID, DoctorID, DateTime, Status, Notes, etc.)
- **PerformedAction** — stores clinical procedures performed during an appointment (ProcedureTypeID, ToothInvolved, SurfacesInvolved, AnesthesiaUsed, FacilitiesUsed, pricing)

One Appointment has many PerformedActions (cascade delete).

## RBAC for Appointment Updates (PATCH)

- **Staff (ADMIN, DOCTOR)**: full update access to all fields
- **Patient**: restricted to Status (confirm/cancel) and ScheduledDateTime (reschedule), with state-machine validation

## Inventory Sync

On create/update/delete of a PerformedAction, the service computes net deltas for facility codes (from `FacilitiesUsed`) and POSTs them to the Clinic & Provider Management Service. Failures on create trigger a rollback of the action record; failures on update/delete log a warning but do not block the operation.

## API Routes

### Appointments — `/api/v1/appointments`
| Method | Path           | Description        |
|--------|----------------|--------------------|
| POST   | `/`            | Create             |
| GET    | `/`            | List all           |
| GET    | `/:id`         | Get by ID          |
| PATCH  | `/:id`         | Update (RBAC)      |
| DELETE | `/:id`         | Delete             |

### Performed Actions — `/api/v1`
| Method | Path                          | Description        |
|--------|-------------------------------|--------------------|
| POST   | `/appointments/:id/actions`   | Create for appointment |
| GET    | `/appointments/:id/actions`   | List for appointment   |
| GET    | `/actions/:actionId`          | Get by ID          |
| PATCH  | `/actions/:actionId`          | Update             |
| DELETE | `/actions/:actionId`          | Delete             |
