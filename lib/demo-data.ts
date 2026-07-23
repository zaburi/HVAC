import {
  canTransitionJob,
  generateCode,
  inventoryHealth,
  technicianScore,
  weightedAverageCost,
  type JobStatus,
} from "./operations.ts";

export class DemoValidationError extends Error {
  field?: string;
  code: string;

  constructor(
    message: string,
    field?: string,
    code = "VALIDATION_ERROR",
  ) {
    super(message);
    this.field = field;
    this.code = code;
  }
}

export type DemoBranch = {
  id: string;
  code: string;
  name: string;
};

export type DemoWarehouse = {
  id: string;
  branch_id: string;
  name: string;
};

export type DemoItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  supplier: string;
  unit: string;
  minimum_stock: number;
  reorder_quantity: number;
  standard_cost: number;
  quantity: number;
  average_cost: number;
  version: number;
  warehouse_name: string;
  health: ReturnType<typeof inventoryHealth>;
  value: number;
};

export type DemoJob = {
  id: string;
  branch_id: string;
  branch_name: string;
  technician_id: string;
  technician_name: string;
  code: string;
  customer: string;
  site: string;
  type: string;
  priority: string;
  status: JobStatus;
  description: string;
  logged_at: string;
  target_at: string;
  completed_at: string | null;
  resolution: string | null;
  parts_cost: number;
};

export type DemoTechnician = {
  id: string;
  branch_id: string;
  branch_name: string;
  code: string;
  name: string;
  phone: string;
  position: string;
  primary_skill: string;
  employment_status: string;
  assigned: number;
  completed: number;
  pending: number;
  on_time: number;
  score: number;
};

export type DemoMovement = {
  id: string;
  code: string;
  movement_type: string;
  quantity_delta: number;
  unit_cost: number;
  total_cost: number;
  reference: string;
  actor: string;
  created_at: string;
  item_name: string;
  item_code: string;
  item_id: string;
  job_id: string | null;
  technician_id: string | null;
  technician_name: string | null;
};

export type DemoAudit = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  after_json: string | null;
  created_at: string;
};

export type DemoSnapshot = {
  demoMode: true;
  generatedAt: string;
  organization: {
    id: string;
    name: string;
    currency: string;
    timezone: string;
    target_turnaround_days: number;
    critical_factor: number;
  };
  branches: DemoBranch[];
  warehouses: DemoWarehouse[];
  items: DemoItem[];
  jobs: DemoJob[];
  technicians: DemoTechnician[];
  movements: DemoMovement[];
  audits: DemoAudit[];
};

function day(offset: number, hour = 9) {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString();
}

const branches = [
  { id: "br_aru", code: "ARU", name: "Arusha" },
  { id: "br_dar", code: "DSM", name: "Dar es Salaam" },
  { id: "br_mza", code: "MZA", name: "Mwanza" },
];

const warehouses = [
  { id: "wh_arusha", branch_id: "br_aru", name: "Arusha Depot" },
  { id: "wh_central", branch_id: "br_dar", name: "Central Store" },
  { id: "wh_mwanza", branch_id: "br_mza", name: "Mwanza Depot" },
];

const technicianSeed = [
  ["tec_003", "br_aru", "TEC-003", "Baraka Said", "+255 700 000 103", "Senior Technician", "Chillers"],
  ["tec_005", "br_dar", "TEC-005", "Eliakim Paul", "+255 700 000 105", "Installer", "Ducting"],
  ["tec_006", "br_aru", "TEC-006", "Grace Kweka", "+255 700 000 106", "Technician", "Controls"],
  ["tec_001", "br_dar", "TEC-001", "John Mushi", "+255 700 000 101", "Senior Technician", "VRF Systems"],
  ["tec_002", "br_dar", "TEC-002", "Neema Lema", "+255 700 000 102", "Technician", "Split Units"],
  ["tec_004", "br_mza", "TEC-004", "Rehema Joseph", "+255 700 000 104", "Technician", "Cold Rooms"],
] as const;

const itemSeed = [
  ["itm_001", "ITM-0001", "Copper pipe 1/2 inch", "Piping", "Mueller", "Demo Refrigeration Supply", "coil", 12, 20, 185000, 8, 192500],
  ["itm_002", "ITM-0002", "R410A refrigerant 11.3kg", "Refrigerants", "Chemours", "Demo Cold Chain", "cylinder", 8, 12, 315000, 3, 327500],
  ["itm_003", "ITM-0003", "Compressor 24,000 BTU", "Compressors", "GMCC", "Demo Cooling Parts", "unit", 4, 5, 780000, 2, 804000],
  ["itm_004", "ITM-0004", "Contactor 40A 3-pole", "Electrical", "Schneider", "Demo Power Supply", "unit", 10, 15, 84000, 22, 86500],
  ["itm_005", "ITM-0005", "Drain pump mini", "Condensate", "Aspen", "Demo Refrigeration Supply", "unit", 6, 8, 245000, 14, 239000],
  ["itm_006", "ITM-0006", "Air filter 600 x 600", "Filtration", "AAF", "Demo Facility Parts", "piece", 20, 30, 48000, 17, 49500],
  ["itm_007", "ITM-0007", "Digital thermostat", "Controls", "Honeywell", "Demo Power Supply", "unit", 8, 12, 168000, 28, 171500],
  ["itm_008", "ITM-0008", "Fan motor 1/4 HP", "Motors", "Welling", "Demo Cooling Parts", "unit", 5, 7, 295000, 1, 306000],
  ["itm_009", "ITM-0009", "PVC insulation tape", "Consumables", "3M", "Demo Facility Parts", "roll", 25, 40, 7800, 68, 8050],
  ["itm_010", "ITM-0010", "Capacitor 45µF", "Electrical", "Ducati", "Demo Power Supply", "unit", 15, 20, 29000, 15, 30250],
] as const;

const jobSeed = [
  ["job_1041", "br_dar", "tec_002", "JOB-1041", "Mlimani City Demo", "Food court AHU-04", "MAINTENANCE", "HIGH", "ASSIGNED", "Quarterly AHU inspection and filter replacement", -1, 1, null, null, 99000],
  ["job_1039", "br_mza", "tec_004", "JOB-1039", "Rock City Demo Mall", "Cold room CR-02", "REPAIR", "URGENT", "IN_PROGRESS", "Cold room not reaching set point", -1, 0, null, null, 327500],
  ["job_1042", "br_dar", "tec_001", "JOB-1042", "Serengeti Demo Plant", "Ilala Production Plant", "REPAIR", "URGENT", "IN_PROGRESS", "Chiller circuit 2 losing pressure", -2, -1, null, null, 327500],
  ["job_1040", "br_aru", "tec_003", "JOB-1040", "Arusha Demo Lodge", "Guest wing - level 2", "INSTALLATION", "NORMAL", "ON_HOLD", "Install and commission 8 split AC units", -4, -1, null, null, 0],
  ["job_1038", "br_dar", "tec_005", "JOB-1038", "Demo Bank HQ", "Data centre - 4th floor", "MAINTENANCE", "HIGH", "COMPLETED", "Precision cooling preventive maintenance", -6, -3, -3, "Completed full service and control calibration", 0],
  ["job_1037", "br_aru", "tec_006", "JOB-1037", "Mount Meru Demo Hotel", "Conference wing", "REPAIR", "NORMAL", "COMPLETED", "BMS thermostat communication fault", -7, -4, -5, "Replaced thermostat and recommissioned controls", 171500],
  ["job_1036", "br_dar", "tec_001", "JOB-1036", "Demo Hospital", "Theatre AHU-02", "MAINTENANCE", "URGENT", "COMPLETED", "HEPA pressure alarm inspection", -9, -7, -8, "Replaced blocked pre-filter and verified pressure", 49500],
  ["job_1035", "br_mza", "tec_004", "JOB-1035", "Mwanza Demo Airport", "Arrivals hall", "INSTALLATION", "HIGH", "COMPLETED", "Replace two cassette units", -13, -9, -10, "Installed, tested and handed over", 612000],
  ["job_1034", "br_dar", "tec_002", "JOB-1034", "Demo Telecom", "Mlimani switch room", "REPAIR", "NORMAL", "COMPLETED", "High ambient temperature alarm", -15, -12, -13, "Cleaned condenser and restored airflow", 86500],
  ["job_1033", "br_aru", "tec_003", "JOB-1033", "Demo Shopping Centre", "Roof plant room", "MAINTENANCE", "NORMAL", "COMPLETED", "Monthly chiller maintenance", -18, -14, -15, "Maintenance checklist completed", 0],
  ["job_1032", "br_dar", "tec_005", "JOB-1032", "Demo Regency", "Kitchen extract", "REPAIR", "HIGH", "CANCELLED", "Extract fan vibration assessment", -20, -17, null, "Cancelled by customer", 0],
  ["job_1031", "br_mza", "tec_004", "JOB-1031", "Demo Medical Centre", "Pharmacy cold room", "MAINTENANCE", "HIGH", "COMPLETED", "Cold room preventive maintenance", -22, -19, -20, "Serviced and temperature-mapped", 30250],
] as const;

const movementSeed = [
  ["led_201", "itm_002", "job_1042", "tec_001", "ISS-0201", "ISSUE", -1, 327500, "Emergency refrigerant issue", -1],
  ["led_202", "itm_006", "job_1041", "tec_002", "ISS-0202", "ISSUE", -2, 49500, "AHU filters", -1],
  ["led_203", "itm_004", null, null, "GRN-0118", "RECEIPT", 10, 86500, "Demo PO-3481", -2],
  ["led_204", "itm_010", "job_1031", "tec_004", "ISS-0200", "ISSUE", -1, 30250, "Fault replacement", -3],
  ["led_205", "itm_007", "job_1037", "tec_006", "ISS-0199", "ISSUE", -1, 171500, "Controls replacement", -5],
  ["led_206", "itm_009", null, null, "GRN-0117", "RECEIPT", 40, 8050, "Demo supplier invoice", -6],
  ["led_207", "itm_008", "job_1035", "tec_004", "ISS-0198", "ISSUE", -2, 306000, "Cassette fan motor replacement", -10],
  ["led_208", "itm_006", "job_1036", "tec_001", "ISS-0197", "ISSUE", -1, 49500, "Theatre AHU pre-filter", -8],
  ["led_209", "itm_004", "job_1034", "tec_002", "ISS-0196", "ISSUE", -1, 86500, "Condenser contactor replacement", -13],
] as const;

export function createDemoSnapshot(): DemoSnapshot {
  const items: DemoItem[] = itemSeed.map(
    ([id, code, name, category, brand, supplier, unit, minimum, reorder, standard, quantity, average]) => ({
      id,
      code,
      name,
      category,
      brand,
      supplier,
      unit,
      minimum_stock: minimum,
      reorder_quantity: reorder,
      standard_cost: standard,
      quantity,
      average_cost: average,
      version: 1,
      warehouse_name: "Central Store",
      health: inventoryHealth(quantity, minimum, 0.5),
      value: quantity * average,
    }),
  );

  const jobs: DemoJob[] = jobSeed.map(
    ([id, branchId, technicianId, code, customer, site, type, priority, status, description, loggedOffset, targetOffset, completedOffset, resolution, partsCost]) => ({
      id,
      branch_id: branchId,
      branch_name: branches.find((branch) => branch.id === branchId)?.name ?? "",
      technician_id: technicianId,
      technician_name: technicianSeed.find((technician) => technician[0] === technicianId)?.[3] ?? "",
      code,
      customer,
      site,
      type,
      priority,
      status,
      description,
      logged_at: day(loggedOffset),
      target_at: day(targetOffset),
      completed_at: completedOffset === null ? null : day(completedOffset),
      resolution,
      parts_cost: partsCost,
    }),
  );

  const maxCompleted = Math.max(
    ...technicianSeed.map(([id]) =>
      jobs.filter((job) => job.technician_id === id && job.status === "COMPLETED").length,
    ),
    1,
  );

  const technicians: DemoTechnician[] = technicianSeed.map(
    ([id, branchId, code, name, phone, position, primarySkill]) => {
      const assignedJobs = jobs.filter(
        (job) => job.technician_id === id && job.status !== "CANCELLED",
      );
      const completedJobs = assignedJobs.filter(
        (job) => job.status === "COMPLETED",
      );
      const onTimeJobs = completedJobs.filter(
        (job) =>
          job.completed_at &&
          new Date(job.completed_at) <= new Date(job.target_at),
      );
      return {
        id,
        branch_id: branchId,
        branch_name:
          branches.find((branch) => branch.id === branchId)?.name ?? "",
        code,
        name,
        phone,
        position,
        primary_skill: primarySkill,
        employment_status: "ACTIVE",
        assigned: assignedJobs.length,
        completed: completedJobs.length,
        pending: assignedJobs.length - completedJobs.length,
        on_time: onTimeJobs.length,
        score: technicianScore({
          assigned: assignedJobs.length,
          completed: completedJobs.length,
          onTime: onTimeJobs.length,
          maxCompleted,
        }),
      };
    },
  );

  const movements: DemoMovement[] = movementSeed.map(
    ([id, itemId, jobId, technicianId, code, type, delta, unitCost, reference, offset]) => {
      const item = items.find((candidate) => candidate.id === itemId);
      return {
        id,
        code,
        movement_type: type,
        quantity_delta: delta,
        unit_cost: unitCost,
        total_cost: Math.abs(delta) * unitCost,
        reference,
        actor: "Asha Mwita · Demo",
        created_at: day(offset),
        item_name: item?.name ?? "",
        item_code: item?.code ?? "",
        item_id: itemId,
        job_id: jobId,
        technician_id: technicianId,
        technician_name:
          technicianSeed.find((technician) => technician[0] === technicianId)?.[3] ??
          null,
      };
    },
  );

  const audits: DemoAudit[] = [
    ["aud_2", "STATUS_CHANGE", "Job", "JOB-1040", -1],
    ["aud_1", "POST", "StockIssue", "ISS-0201", -1],
    ["aud_3", "POST", "StockReceipt", "GRN-0118", -2],
    ["aud_4", "COMPLETE", "Job", "JOB-1038", -3],
  ].map(([id, action, entityType, entityId, offset]) => ({
    id: String(id),
    action: String(action),
    entity_type: String(entityType),
    entity_id: String(entityId),
    actor: "Asha Mwita · Demo",
    after_json: JSON.stringify({ demo: true }),
    created_at: day(Number(offset)),
  }));

  return {
    demoMode: true as const,
    generatedAt: new Date().toISOString(),
    organization: {
      id: "org_demo",
      name: "Kibo Climate Services · Demo",
      currency: "TZS",
      timezone: "Africa/Dar_es_Salaam",
      target_turnaround_days: 3,
      critical_factor: 0.5,
    },
    branches,
    warehouses,
    items,
    jobs,
    technicians,
    movements,
    audits,
  };
}

function requiredString(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();
  if (!value) throw new DemoValidationError(`${key} is required`, key);
  return value;
}

function positiveNumber(payload: Record<string, unknown>, key: string) {
  const value = Number(payload[key]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new DemoValidationError(`${key} must be greater than zero`, key);
  }
  return value;
}

export function applyDemoOperation(
  current: DemoSnapshot,
  payload: Record<string, unknown>,
) {
  const snapshot = structuredClone(current);
  const action = requiredString(payload, "action");
  const actor = String(payload.actor ?? "Asha Mwita · Demo");
  const now = new Date().toISOString();
  let result: Record<string, unknown>;

  if (action === "createJob") {
    const id = `job_demo_${crypto.randomUUID()}`;
    const branchId = requiredString(payload, "branchId");
    const technicianId = requiredString(payload, "technicianId");
    const loggedAt = now;
    const target = new Date(loggedAt);
    target.setUTCDate(target.getUTCDate() + 3);
    const job: DemoJob = {
      id,
      code: generateCode("JOB", 1043 + snapshot.jobs.length - 12),
      branch_id: branchId,
      branch_name:
        snapshot.branches.find((branch) => branch.id === branchId)?.name ?? "",
      technician_id: technicianId,
      technician_name:
        snapshot.technicians.find(
          (technician) => technician.id === technicianId,
        )?.name ?? "",
      customer: requiredString(payload, "customer"),
      site: requiredString(payload, "site"),
      type: requiredString(payload, "type"),
      priority: requiredString(payload, "priority"),
      status: "ASSIGNED",
      description: requiredString(payload, "description"),
      logged_at: loggedAt,
      target_at: target.toISOString(),
      completed_at: null,
      resolution: null,
      parts_cost: 0,
    };
    snapshot.jobs.unshift(job);
    result = { ok: true, action, job };
  } else if (action === "createItem") {
    const standardCost = positiveNumber(payload, "standardCost");
    const quantity = Number(payload.openingQuantity ?? 0);
    const minimum = positiveNumber(payload, "minimumStock");
    const item = {
      id: `itm_demo_${crypto.randomUUID()}`,
      code: generateCode("ITM", snapshot.items.length + 1),
      name: requiredString(payload, "name"),
      category: requiredString(payload, "category"),
      brand: requiredString(payload, "brand"),
      supplier: requiredString(payload, "supplier"),
      unit: requiredString(payload, "unit"),
      minimum_stock: minimum,
      reorder_quantity: positiveNumber(payload, "reorderQuantity"),
      standard_cost: standardCost,
      quantity,
      average_cost: standardCost,
      version: 1,
      warehouse_name: "Central Store",
      health: inventoryHealth(quantity, minimum, 0.5),
      value: quantity * standardCost,
    };
    snapshot.items.push(item);
    result = { ok: true, action, item };
  } else if (action === "postReceipt" || action === "postIssue") {
    const itemId = requiredString(payload, "itemId");
    const quantity = positiveNumber(payload, "quantity");
    const item = snapshot.items.find((candidate) => candidate.id === itemId);
    if (!item) {
      throw new DemoValidationError("Inventory item was not found", "itemId", "NOT_FOUND");
    }
    const isReceipt = action === "postReceipt";
    if (!isReceipt && item.quantity < quantity) {
      throw new DemoValidationError(
        `Available quantity is ${item.quantity} but ${quantity} was requested.`,
        "quantity",
        "INSUFFICIENT_STOCK",
      );
    }
    const before = item.quantity;
    const unitCost = isReceipt
      ? positiveNumber(payload, "unitCost")
      : item.average_cost;
    item.average_cost = isReceipt
      ? weightedAverageCost(item.quantity, item.average_cost, quantity, unitCost)
      : item.average_cost;
    item.quantity += isReceipt ? quantity : -quantity;
    item.value = item.quantity * item.average_cost;
    item.health = inventoryHealth(item.quantity, item.minimum_stock, 0.5);
    item.version += 1;
    const code = generateCode(isReceipt ? "GRN" : "ISS", 120 + snapshot.movements.length);
    const jobId = isReceipt ? null : String(payload.jobId ?? "") || null;
    snapshot.movements.unshift({
      id: `led_demo_${crypto.randomUUID()}`,
      code,
      movement_type: isReceipt ? "RECEIPT" : "ISSUE",
      quantity_delta: isReceipt ? quantity : -quantity,
      unit_cost: unitCost,
      total_cost: quantity * unitCost,
      reference: String(payload.reference ?? "Demo transaction"),
      actor,
      created_at: now,
      item_name: item.name,
      item_code: item.code,
      item_id: item.id,
      job_id: jobId,
      technician_id: isReceipt
        ? null
        : String(payload.technicianId ?? "") || null,
      technician_name:
        snapshot.technicians.find(
          (technician) =>
            technician.id === String(payload.technicianId ?? ""),
        )?.name ?? null,
    });
    if (jobId && !isReceipt) {
      const job = snapshot.jobs.find((candidate) => candidate.id === jobId);
      if (job) job.parts_cost += quantity * unitCost;
    }
    result = {
      ok: true,
      action,
      status: "POSTED",
      code,
      totalCost: quantity * unitCost,
      balanceChange: { itemId, before, after: item.quantity },
    };
  } else if (action === "updateJobStatus") {
    const jobId = requiredString(payload, "jobId");
    const job = snapshot.jobs.find((candidate) => candidate.id === jobId);
    if (!job) {
      throw new DemoValidationError("Job was not found", "jobId", "NOT_FOUND");
    }
    const fromStatus = job.status as JobStatus;
    const toStatus = requiredString(payload, "status") as JobStatus;
    if (!canTransitionJob(fromStatus, toStatus)) {
      throw new DemoValidationError(
        `A job cannot move from ${fromStatus} to ${toStatus}.`,
        "status",
        "INVALID_STATUS_TRANSITION",
      );
    }
    const resolution =
      toStatus === "COMPLETED"
        ? requiredString(payload, "resolution")
        : job.resolution;
    job.status = toStatus;
    job.completed_at = toStatus === "COMPLETED" ? now : null;
    job.resolution = resolution;
    result = { ok: true, action, jobId, fromStatus, toStatus };
  } else {
    throw new DemoValidationError(`Unsupported action: ${action}`, "action");
  }

  snapshot.generatedAt = now;
  snapshot.audits.unshift({
    id: `aud_demo_${crypto.randomUUID()}`,
    action:
      action === "updateJobStatus"
        ? "STATUS_CHANGE"
        : action.startsWith("post")
          ? "POST"
          : "CREATE",
    entity_type: action,
    entity_id: String(
      result.code ??
        (result.job as { code?: string } | undefined)?.code ??
        (result.item as { code?: string } | undefined)?.code ??
        "DEMO",
    ),
    actor,
    after_json: JSON.stringify({ demo: true, action }),
    created_at: now,
  });

  return { snapshot, result };
}
