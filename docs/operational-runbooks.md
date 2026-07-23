# CoolOps operational runbooks

## Failed stock posting

1. Capture the API trace ID and the posting idempotency key.
2. Check the audit log for a completed POST action with the same document reference.
3. If the idempotency response exists, return the original success result and do not post again.
4. If no ledger or audit record exists, refresh the item balance/version and retry with the original idempotency key.
5. If the balance version changed, recalculate availability and weighted cost before posting.
6. Never edit a posted ledger row; use a return or reversal operation.

## Stock discrepancy

1. Filter the ledger to organization, warehouse and item.
2. Recalculate opening + receipts + returns + adjustments in - issues - adjustments out.
3. Compare the result with the materialized inventory balance and version.
4. Check for unlinked/unknown references and repeated external document numbers.
5. Record an authorized adjustment with a reason; do not type over the current balance.

## Overdue-job backlog

1. Filter open jobs where target time is earlier than now.
2. Group by branch and technician.
3. Confirm hold reasons and identify jobs without a current owner.
4. Reassign or update the target only with a recorded reason.
5. Escalate urgent jobs first and confirm the exception count returns to zero after correction.

## Attachment incident

1. Identify the attachment metadata and parent record.
2. Revoke or delete the object from private storage when access is unsafe.
3. Preserve the metadata and add an audit record describing the action.
4. Rotate any compromised signed access path.
5. Validate file type and size before allowing a replacement.

## Restore and recovery

1. Stop write operations while allowing clear read/error messaging.
2. Restore the database to the selected recovery point.
3. Reconcile organization, branch, item, balance, ledger, job and audit counts.
4. Recompute balances and job parts cost from immutable movements.
5. Exercise create item → receipt → job → issue → completion before reopening writes.
