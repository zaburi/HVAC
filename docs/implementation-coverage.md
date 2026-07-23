# HVAC demo implementation coverage

This checklist maps the HVAC technical specification to the public Vercel demo.

| Specification area | Demo behavior |
| --- | --- |
| Organization and branches | Fictional organization, TZS/timezone settings, three branches and branch filtering |
| User access | Fixed fictional demo identity; production authentication and authorization are not connected |
| Dashboard | KPI blocks, trends, status distribution, exceptions, technician leaderboard, filters and drill-downs |
| Inventory | Generated item codes, classification, thresholds, quantity, average cost, value, health and recent movements |
| Receipts | Quantity/cost validation, weighted-average update and a session-only movement record |
| Issues | Job/technician link, current-cost snapshot, negative-stock prevention and session-only parts cost |
| Jobs | Generated codes, fictional customers/sites, priority, assignment, controlled statuses, completion and activity |
| Technicians | Fictional directory, workload, score components and links to active work |
| Reports | Operational catalogue, branch comparison, summaries and CSV export |
| Settings | Organization, inventory, workflow, scoring and identifier demonstrations |
| Audit | Session-only actor, action, entity and timestamp records |
| Attachments | MIME and 10 MB size validation only; files are never uploaded or retained |
| Mobile/accessibility | Responsive shell, mobile navigation, visible focus, keyboard command palette, labels and reduced-motion support |
| Data rules | Weighted average, stock thresholds, status transitions, completion requirements, technician formula and display codes |
| Quality | Build, lint, type-check, domain tests, demo-state tests and production bundle validation |

## Public-demo boundary

The Vercel deployment deliberately has no database, object storage, sign-in provider, email service or background queue. Demo mutations live only in browser memory and reset on refresh.

For production, retain `lib/operations.ts` as the domain-rule source and replace `lib/demo-data.ts` with authenticated organization-scoped repositories. Add a transactional database, private object storage, durable idempotency, server-side authorization, background jobs, monitoring, backups and recovery testing before using real operational data.
