import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransitionJob,
  generateCode,
  inventoryHealth,
  technicianScore,
  weightedAverageCost,
} from "../lib/operations.ts";

test("recalculates perpetual weighted-average receipt cost", () => {
  assert.equal(weightedAverageCost(8, 192_500, 2, 200_000), 194_000);
  assert.equal(weightedAverageCost(0, 0, 4, 315_000), 315_000);
});

test("classifies inventory using critical and minimum thresholds", () => {
  assert.equal(inventoryHealth(4, 8, 0.5), "CRITICAL");
  assert.equal(inventoryHealth(6, 8, 0.5), "LOW");
  assert.equal(inventoryHealth(9, 8, 0.5), "HEALTHY");
});

test("calculates the documented technician score components", () => {
  assert.equal(
    technicianScore({
      assigned: 4,
      completed: 3,
      onTime: 2,
      maxCompleted: 4,
    }),
    73.3,
  );
  assert.equal(
    technicianScore({
      assigned: 0,
      completed: 0,
      onTime: 0,
      maxCompleted: 0,
    }),
    0,
  );
});

test("enforces the job lifecycle", () => {
  assert.equal(canTransitionJob("ASSIGNED", "IN_PROGRESS"), true);
  assert.equal(canTransitionJob("IN_PROGRESS", "ON_HOLD"), true);
  assert.equal(canTransitionJob("ON_HOLD", "IN_PROGRESS"), true);
  assert.equal(canTransitionJob("IN_PROGRESS", "COMPLETED"), true);
  assert.equal(canTransitionJob("COMPLETED", "IN_PROGRESS"), false);
  assert.equal(canTransitionJob("ASSIGNED", "COMPLETED"), false);
});

test("generates organization-scoped visible identifiers", () => {
  assert.equal(generateCode("ITM", 7), "ITM-0007");
  assert.equal(generateCode("TEC", 12, 3), "TEC-012");
});
