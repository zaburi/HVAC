# CoolOps future-production runbooks

These runbooks describe controls required for a future production system. They are **not active in the public demo**, which has no durable database or file storage.

## Failed stock posting

1. Capture the API trace ID and posting idempotency key.
2. Check the audit log for a completed action with the same document reference.
3. If an idempotent response exists, return the original result and do not post again.
4. If no ledger or audit record exists, refresh the item balance/version and retry with the original key.
5. If the balance version changed, recalculate availability and weighted cost before posting.
6. Never edit a posted ledger row; use a return or reversal operation.

## Stock discrepancy

1. Filter the ledger to organization, warehouse and item.
2. Recalculate opening plus inbound movements minus outbound movements.
3. Compare the result with the materialized inventory balance and version.
4. Check for unlinked references and repeated external document numbers.
5. Record an authorized adjustment with a reason; never overwrite the current balance.

## Overdue-job backlog

1. Filter open jobs whose target time is earlier than now.
2. Group by branch and technician.
3. Confirm hold reasons and identify jobs without an owner.
4. Reassign or change the target only with a recorded reason.
5. Escalate urgent jobs first and verify that the exception count falls.

## Attachment incident

1. Identify the attachment metadata and parent record.
2. Revoke or delete the private-storage object if access is unsafe.
3. Preserve the audit trail describing the response.
4. Rotate any compromised signed access path.
5. Validate file type and size before accepting a replacement.

## Restore and recovery

1. Stop writes while keeping clear read-only and error messaging available.
2. Restore the database to the selected recovery point.
3. Reconcile organization, branch, item, balance, ledger, job and audit counts.
4. Recompute balances and job parts cost from immutable movements.
5. Exercise create item → receipt → job → issue → completion before reopening writes.
