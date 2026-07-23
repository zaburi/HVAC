export type InventoryHealth = "HEALTHY" | "LOW" | "CRITICAL";
export type JobStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export function inventoryHealth(
  quantity: number,
  minimumStock: number,
  criticalFactor = 0.5,
): InventoryHealth {
  if (quantity <= minimumStock * criticalFactor) return "CRITICAL";
  if (quantity <= minimumStock) return "LOW";
  return "HEALTHY";
}

export function weightedAverageCost(
  currentQuantity: number,
  currentAverageCost: number,
  receivedQuantity: number,
  receivedUnitCost: number,
): number {
  const newQuantity = currentQuantity + receivedQuantity;
  if (newQuantity <= 0) return 0;
  return roundMoney(
    (currentQuantity * currentAverageCost +
      receivedQuantity * receivedUnitCost) /
      newQuantity,
  );
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function daysBetween(start: string, end: string): number {
  const milliseconds = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.ceil(milliseconds / 86_400_000));
}

export function technicianScore(input: {
  assigned: number;
  completed: number;
  onTime: number;
  maxCompleted: number;
  weights?: { completion: number; volume: number; timeliness: number };
}): number {
  const weights = input.weights ?? {
    completion: 50,
    volume: 30,
    timeliness: 20,
  };
  const completionRate =
    input.assigned > 0 ? input.completed / input.assigned : 0;
  const volumeRate =
    input.maxCompleted > 0 ? input.completed / input.maxCompleted : 0;
  const onTimeRate = input.completed > 0 ? input.onTime / input.completed : 0;

  return Math.round(
    (weights.completion * completionRate +
      weights.volume * volumeRate +
      weights.timeliness * onTimeRate) *
      10,
  ) / 10;
}

const transitions: Record<JobStatus, JobStatus[]> = {
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionJob(
  from: JobStatus,
  to: JobStatus,
): boolean {
  return transitions[from].includes(to);
}

export function generateCode(
  prefix: string,
  sequence: number,
  padding = 4,
): string {
  return `${prefix}-${String(sequence).padStart(padding, "0")}`;
}
