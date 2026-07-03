# denti-code-appointments

Appointments & Clinical Records microservice for the denti-code dental practice platform.

## System Overview

```
                                        ┌──────────────────────────┐
                                        │      API Gateway         │
                                        │   (auth, routing)       │
                                        └────┬─────────┬──────────┘
                                             │         │
                                   x-user-email     requests
                                             │         │
                                             ▼         ▼
┌──────────────────────┐          ┌──────────────────────────────────┐
│  Patient Management  │◄────────►│   denti-code-appointments        │
│  (port 3001)         │  HTTP    │   (port 3003)                    │
│                      │          │                                  │
│  - Patient identity   │          │  ┌──────────────────────────┐   │
│  - Profile data      │          │  │     Fastify v5           │   │
└──────────────────────┘          │  │  ┌─────────────────────┐  │   │
                                  │  │  │ Appointments        │  │   │
                                  │  │  │  CRUD + RBAC        │  │   │
                                  │  │  └─────────────────────┘  │   │
                                  │  │  ┌─────────────────────┐  │   │
                                  │  │  │ Performed Actions   │  │   │
                                  │  │  │  CRUD + Inventory   │  │   │
                                  │  │  │  Sync               │  │   │
                                  │  │  └─────────────────────┘  │   │
                                  │  │  ┌─────────────────────┐  │   │
                                  │  │  │ Prisma ORM          │  │   │
                                  │  │  └──────┬──────────────┘  │   │
                                  │  └─────────┼────────────────┘   │
                                  └────────────┼────────────────────┘
                                               │
                                  ┌────────────▼────────────┐
                                  │    SQLite / PostgreSQL   │
                                  │                         │
                                  │  Appointments           │
                                  │  PerformedActions       │
                                  └─────────────────────────┘
                                               │
                                  ┌────────────▼────────────┐
                                  │  Clinic & Provider Mgmt │
                                  │  (port 3002)            │
                                  │                         │
                                  │  - Procedure catalog    │
                                  │  - Provider records     │
                                  │  - Inventory            │
                                  └─────────────────────────┘
```

## Data Model

```
┌─────────────────┐        ┌──────────────────────────┐
│   Appointment    │        │    PerformedAction        │
├─────────────────┤        ├──────────────────────────┤
│ AppointmentID PK │──1:N──│  PerformedActionID PK     │
│ PatientID        │        │  AppointmentID FK         │
│ PrimaryDoctorID  │        │  ProcedureTypeID          │
│ ScheduledDateTime│        │  PerformingDoctorID       │
│ Status           │        │  ToothInvolved            │
│ Notes            │        │  SurfacesInvolved         │
│ CreationDateTime │        │  FacilitiesUsed (JSON[])  │
│ LastUpdate...... │        │  Quantity · UnitPrice     │
└─────────────────┘        │  TotalPrice               │
                            └──────────────────────────┘
```

## Key Features

- **Appointment CRUD** — schedule, list, get, update, delete appointments
- **Role-Based Access** — staff (ADMIN/DOCTOR) full access; patients restricted to confirm/cancel/reschedule their own appointments
- **Performed Actions** — record procedures, tooth surfaces, anesthesia, facilities used
- **Inventory Sync** — automatically sync facility/material consumption with the Clinic & Provider Management Service
- **Validation** — request/response schemas via fluent-json-schema, centralized error handling
- **Cross-Service Identity** — patient resolution via Patient Management Service using `x-user-email` header

## Getting Started

```bash
npm install
npx prisma migrate dev
npm run dev
```

Server starts on `http://0.0.0.0:3003`.

## Docs

- [Architecture](./ARCHITECTURE.md)
- [Tech Stack](./TECH_STACK.md)
