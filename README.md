# CoolOps

CoolOps is the implementation of the HVAC Operations Management System specification. It brings jobs, inventory, stock control, technicians, reporting, configuration, audit history and field-friendly workflows into one responsive operations workspace.

## What is implemented

- Dashboard KPIs, trend/status charts, exception queues and drill-downs
- Jobs list, filtering, assignment, validated status changes, completion and activity
- Inventory health, valuation, weighted-average costing, thresholds and item history
- Immutable stock receipts and issues with idempotency and negative-stock protection
- Technician workload, on-time performance and transparent weighted scoring
- Branch reporting, inventory/report exports and data-health summaries
- Organization, inventory, workflow, scoring and identifier settings
- Audit attribution for master-data, posting and lifecycle actions
- D1-backed durable operational records and R2-backed attachments
- Workspace-authenticated identity display, responsive technician use and keyboard command palette

The sample workspace is Kibo Climate Services with realistic Tanzanian branches, TZS currency, technicians, jobs and inventory. It seeds once and then persists changes.

## Run locally

Requirements: Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Open the local address printed by the development server.

## Quality checks

```bash
npm run lint
npx tsc --noEmit --incremental false
npm test
```

The test suite covers weighted-average cost, inventory health boundaries, technician scoring, allowed job transitions, identifier generation and server-rendered product metadata.

## Data and deployment

- `.openai/hosting.json` declares the `DB` D1 database and `FILES` R2 bucket.
- `db/schema.ts` contains the relational schema.
- `drizzle/0000_military_unicorn.sql` is the generated migration.
- `lib/database.ts` owns runtime initialization, seeded sample data, queries and transactional operations.
- `lib/operations.ts` owns reusable business rules.
- `app/api/v1/operations` exposes the versioned operational API used by the workspace.
- `app/api/v1/attachments` stores validated JPG, PNG, WebP and PDF files up to 10 MB.

All records are organization scoped. Posted movements are appended to the ledger, and retryable posts use an `Idempotency-Key`.

## Current implementation boundary

This repository is a complete runnable product slice on OpenAI Sites using Next.js/Vinext, D1 and R2. The source specification’s larger-enterprise deployment choices (NestJS, PostgreSQL, Redis/BullMQ, Supabase Auth and provider email) remain the scale-out target; the domain boundaries and API payloads are kept portable so those services can be introduced without changing the product workflows.
