import assert from "node:assert/strict";
import test from "node:test";
import {
  DemoValidationError,
  applyDemoOperation,
  createDemoSnapshot,
} from "../lib/demo-data.ts";

test("creates an explicitly fictional, resettable demo snapshot", () => {
  const first = createDemoSnapshot();
  const second = createDemoSnapshot();

  assert.equal(first.demoMode, true);
  assert.match(first.organization.name, /Demo/);
  assert.ok(first.jobs.every((job) => /Demo/i.test(job.customer)));
  assert.ok(
    first.technicians.every((technician) =>
      technician.phone.startsWith("+255 700 000"),
    ),
  );
  assert.notStrictEqual(first, second);
});

test("posts a receipt in memory using weighted-average cost", () => {
  const initial = createDemoSnapshot();
  const item = initial.items[0];
  const { snapshot, result } = applyDemoOperation(initial, {
    action: "postReceipt",
    itemId: item.id,
    quantity: 2,
    unitCost: 200_000,
    reference: "Demo receipt",
  });
  const updated = snapshot.items.find((candidate) => candidate.id === item.id);

  assert.equal(result.status, "POSTED");
  assert.equal(initial.items[0].quantity, 8);
  assert.equal(updated?.quantity, 10);
  assert.equal(updated?.average_cost, 194_000);
});

test("prevents negative demo stock", () => {
  const initial = createDemoSnapshot();
  const item = initial.items[0];

  assert.throws(
    () =>
      applyDemoOperation(initial, {
        action: "postIssue",
        itemId: item.id,
        quantity: item.quantity + 1,
      }),
    (error) =>
      error instanceof DemoValidationError &&
      error.code === "INSUFFICIENT_STOCK",
  );
});
