# HVAC Operations Demo

HVAC is a responsive demonstration of the operations management system described in the implementation specification. It brings jobs, inventory, stock control, technicians, reporting, settings and audit history into one operations workspace.

> **Demo only:** every customer, supplier, contact, technician and transaction is fictional. Changes stay in the current browser session and reset when the page is refreshed or the demo is reset. Do not enter real or confidential information.

## Included in the demo

- Operations dashboard with KPIs, trends, exceptions and drill-downs
- Job creation, assignment and validated lifecycle changes
- Inventory health, valuation and weighted-average costing
- Stock receipts and issues with negative-stock protection
- Technician workload and transparent performance scoring
- Branch reports, CSV export, settings and audit history
- Responsive layouts for desktop and field use
- Versioned demo API routes for exploring the product contract

The sample organization is **Kibo Climate Services · Demo** and uses fictional Tanzanian branches, contacts and operating records.

## Run locally

Requirements: Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Open the address printed by Next.js.

## Deploy to Vercel

The repository is a standard Next.js app with no required environment variables or external services.

1. Import `zaburi/HVAC` in Vercel.
2. Keep the detected framework as **Next.js**.
3. Keep the default build and output settings.
4. Deploy.

[Deploy with Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzaburi%2FHVAC)

## Quality checks

```bash
npm run lint
npx tsc --noEmit --incremental false
npm test
```

The checks cover domain rules, demo-state behavior, the production build and the visible demo disclosure.

## Architecture

- `app/hvac-app.tsx` contains the interactive product workspace.
- `lib/demo-data.ts` creates and updates resettable fictional data.
- `lib/operations.ts` contains reusable HVAC business rules.
- `app/api/v1` provides non-persistent demo API responses.

Production authentication, durable storage, object storage, notification delivery and background jobs are intentionally not included in this public demo.
