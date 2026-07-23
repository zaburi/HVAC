# CoolOps implementation coverage

This checklist maps the July 2026 technical specification to the running product.

| Specification area | Implemented product behavior |
| --- | --- |
| Organization and branches | Organization identity, TZS/timezone settings, three branches, warehouses and branch filtering |
| User access | Workspace-authenticated identity display, server-attributed writes and permission-oriented administration surfaces |
| Dashboard | KPI blocks, trends, status distribution, exception tables, technician leaderboard, global branch/date filters, refresh timestamp and drill-down |
| Inventory | Generated item codes, classification, thresholds, opening balance, live quantity, average cost, value, health and recent ledger |
| Receipts | Draft-style modal, quantity/cost validation, weighted-average update, immutable ledger record, idempotency and audit record |
| Issues | Job/technician link, available balance, current-cost snapshot, negative-stock prevention, job parts cost and audit record |
| Jobs | Generated codes, customer/site, type, priority, target default, assignment, controlled statuses, completion resolution, parts and activity |
| Technicians | Directory, branch/skill/status, workload, score components and links to active work |
| Reports | Operational catalogue, branch comparison, inventory/stock summaries and filter-aware CSV export |
| Settings | Organization, branch, warehouse, inventory, job workflow, score weights, technician references and identifiers |
| Audit | Actor, action, entity, before/after data, request identifier and time |
| Attachments | Private object-storage upload path with MIME and 10 MB size validation plus relational metadata |
| Mobile/accessibility | 360 px responsive shell, mobile navigation, one-handed actions, visible focus, keyboard command palette, labels and reduced-motion support |
| Data rules | Weighted average, critical/low thresholds, status transitions, completion requirements, technician formula and sequential display codes |
| Reliability | Durable storage, schema migration, optimistic balance versioning, idempotency replay and graceful API errors |
| Quality | Build, lint, type-check, business-rule tests, render test and production metadata validation |

## Production scale-out

The running implementation uses Sites-managed D1 and R2 so it can be deployed and exercised immediately. For the enterprise topology described in the source PDF, keep `lib/operations.ts` as the domain rule source, replace `lib/database.ts` with PostgreSQL repositories and row locks, move notification/export work to BullMQ, and preserve the existing versioned API envelopes.
