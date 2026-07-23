import { env } from "cloudflare:workers";
import {
  canTransitionJob,
  generateCode,
  inventoryHealth,
  technicianScore,
  weightedAverageCost,
  type JobStatus,
} from "./operations";

type RuntimeEnv = {
  DB?: D1Database;
  FILES?: R2Bucket;
};

const ORGANIZATION_ID = "org_coolops";
const DEFAULT_ACTOR = "Asha Mwita";

export function getRuntimeDatabase(): D1Database {
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) throw new Error("The CoolOps database is unavailable.");
  return database;
}

export function getRuntimeFiles(): R2Bucket {
  const files = (env as unknown as RuntimeEnv).FILES;
  if (!files) throw new Error("The CoolOps file store is unavailable.");
  return files;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, currency TEXT NOT NULL,
    timezone TEXT NOT NULL, critical_factor REAL NOT NULL,
    target_turnaround_days INTEGER NOT NULL, created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, code TEXT NOT NULL,
    name TEXT NOT NULL, active INTEGER NOT NULL, created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, branch_id TEXT NOT NULL,
    name TEXT NOT NULL, active INTEGER NOT NULL, created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS technicians (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, branch_id TEXT NOT NULL,
    code TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
    position TEXT NOT NULL, primary_skill TEXT NOT NULL,
    employment_status TEXT NOT NULL, joined_at TEXT NOT NULL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, code TEXT NOT NULL,
    name TEXT NOT NULL, category TEXT NOT NULL, brand TEXT NOT NULL,
    supplier TEXT NOT NULL, unit TEXT NOT NULL, minimum_stock REAL NOT NULL,
    reorder_quantity REAL NOT NULL, standard_cost REAL NOT NULL,
    active INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_balances (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, warehouse_id TEXT NOT NULL,
    item_id TEXT NOT NULL, quantity REAL NOT NULL, average_cost REAL NOT NULL,
    version INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    UNIQUE (organization_id, warehouse_id, item_id)
  )`,
  `CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, branch_id TEXT NOT NULL,
    technician_id TEXT, code TEXT NOT NULL, customer TEXT NOT NULL,
    site TEXT NOT NULL, type TEXT NOT NULL, priority TEXT NOT NULL,
    status TEXT NOT NULL, description TEXT NOT NULL, logged_at TEXT NOT NULL,
    target_at TEXT NOT NULL, completed_at TEXT, resolution TEXT,
    parts_cost REAL NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS job_status_history (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, job_id TEXT NOT NULL,
    from_status TEXT, to_status TEXT NOT NULL, actor TEXT NOT NULL, reason TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS stock_ledger (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, warehouse_id TEXT NOT NULL,
    item_id TEXT NOT NULL, job_id TEXT, technician_id TEXT, code TEXT NOT NULL,
    movement_type TEXT NOT NULL, quantity_delta REAL NOT NULL,
    unit_cost REAL NOT NULL, total_cost REAL NOT NULL, reference TEXT,
    actor TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, actor TEXT NOT NULL,
    action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
    before_json TEXT, after_json TEXT, request_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL, object_key TEXT NOT NULL, filename TEXT NOT NULL,
    content_type TEXT NOT NULL, size INTEGER NOT NULL, uploaded_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY, organization_id TEXT NOT NULL, action TEXT NOT NULL,
    response_json TEXT NOT NULL, created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS jobs_scope_idx
    ON jobs (organization_id, branch_id, status, logged_at)`,
  `CREATE INDEX IF NOT EXISTS jobs_technician_idx
    ON jobs (technician_id, status)`,
  `CREATE INDEX IF NOT EXISTS ledger_item_idx
    ON stock_ledger (organization_id, warehouse_id, item_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS audit_entity_idx
    ON audit_logs (organization_id, entity_type, entity_id, created_at)`,
];

function prepared(
  db: D1Database,
  sql: string,
  bindings: unknown[] = [],
): D1PreparedStatement {
  return db.prepare(sql).bind(...bindings);
}

function nowIso() {
  return new Date().toISOString();
}

function daysFromNow(days: number, hour = 9) {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export async function ensureDatabase(db = getRuntimeDatabase()) {
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));

  const existing = await db
    .prepare("SELECT COUNT(*) AS count FROM organizations")
    .first<{ count: number }>();
  if ((existing?.count ?? 0) > 0) return;

  const now = nowIso();
  const seedStatements: D1PreparedStatement[] = [
    prepared(
      db,
      `INSERT INTO organizations VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ORGANIZATION_ID, "Kibo Climate Services", "TZS", "Africa/Dar_es_Salaam", 0.5, 3, now, now],
    ),
  ];

  const branchSeed = [
    ["br_dar", "DSM", "Dar es Salaam"],
    ["br_aru", "ARU", "Arusha"],
    ["br_mza", "MZA", "Mwanza"],
  ];
  for (const [id, code, name] of branchSeed) {
    seedStatements.push(
      prepared(db, `INSERT INTO branches VALUES (?, ?, ?, ?, 1, ?, ?)`, [
        id,
        ORGANIZATION_ID,
        code,
        name,
        now,
        now,
      ]),
    );
  }

  const warehouseSeed = [
    ["wh_central", "br_dar", "Central Store"],
    ["wh_arusha", "br_aru", "Arusha Depot"],
    ["wh_mwanza", "br_mza", "Mwanza Depot"],
  ];
  for (const [id, branchId, name] of warehouseSeed) {
    seedStatements.push(
      prepared(db, `INSERT INTO warehouses VALUES (?, ?, ?, ?, 1, ?, ?)`, [
        id,
        ORGANIZATION_ID,
        branchId,
        name,
        now,
        now,
      ]),
    );
  }

  const technicianSeed = [
    ["tec_001", "br_dar", "TEC-001", "John Mushi", "+255 754 883 201", "Senior Technician", "VRF Systems", "2022-02-14"],
    ["tec_002", "br_dar", "TEC-002", "Neema Lema", "+255 687 430 921", "Technician", "Split Units", "2023-06-05"],
    ["tec_003", "br_aru", "TEC-003", "Baraka Said", "+255 713 295 108", "Senior Technician", "Chillers", "2021-09-20"],
    ["tec_004", "br_mza", "TEC-004", "Rehema Joseph", "+255 762 443 726", "Technician", "Cold Rooms", "2024-01-08"],
    ["tec_005", "br_dar", "TEC-005", "Eliakim Paul", "+255 718 908 113", "Installer", "Ducting", "2024-04-15"],
    ["tec_006", "br_aru", "TEC-006", "Grace Kweka", "+255 655 611 930", "Technician", "Controls", "2023-11-01"],
  ];
  for (const row of technicianSeed) {
    seedStatements.push(
      prepared(
        db,
        `INSERT INTO technicians VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
        [row[0], ORGANIZATION_ID, row[1], row[2], row[3], row[4], row[5], row[6], row[7], now, now],
      ),
    );
  }

  const items = [
    ["itm_001", "ITM-0001", "Copper pipe 1/2 inch", "Piping", "Mueller", "Jambo Refrigeration", "coil", 12, 20, 185000, 8, 192500],
    ["itm_002", "ITM-0002", "R410A refrigerant 11.3kg", "Refrigerants", "Chemours", "Cold Chain Supplies", "cylinder", 8, 12, 315000, 3, 327500],
    ["itm_003", "ITM-0003", "Compressor 24,000 BTU", "Compressors", "GMCC", "Tropical Cooling", "unit", 4, 5, 780000, 2, 804000],
    ["itm_004", "ITM-0004", "Contactor 40A 3-pole", "Electrical", "Schneider", "PowerTech Tanzania", "unit", 10, 15, 84000, 22, 86500],
    ["itm_005", "ITM-0005", "Drain pump mini", "Condensate", "Aspen", "Jambo Refrigeration", "unit", 6, 8, 245000, 14, 239000],
    ["itm_006", "ITM-0006", "Air filter 600 x 600", "Filtration", "AAF", "Facility Parts Co.", "piece", 20, 30, 48000, 17, 49500],
    ["itm_007", "ITM-0007", "Digital thermostat", "Controls", "Honeywell", "PowerTech Tanzania", "unit", 8, 12, 168000, 28, 171500],
    ["itm_008", "ITM-0008", "Fan motor 1/4 HP", "Motors", "Welling", "Tropical Cooling", "unit", 5, 7, 295000, 1, 306000],
    ["itm_009", "ITM-0009", "PVC insulation tape", "Consumables", "3M", "Facility Parts Co.", "roll", 25, 40, 7800, 68, 8050],
    ["itm_010", "ITM-0010", "Capacitor 45µF", "Electrical", "Ducati", "PowerTech Tanzania", "unit", 15, 20, 29000, 15, 30250],
  ] as const;
  const openingQuantities: Record<string, number> = {
    itm_002: 4,
    itm_004: 13,
    itm_006: 20,
    itm_007: 29,
    itm_008: 3,
    itm_009: 28,
    itm_010: 16,
  };
  for (const [id, code, name, category, brand, supplier, unit, minimum, reorder, standard, quantity, average] of items) {
    const openingQuantity = openingQuantities[id] ?? quantity;
    seedStatements.push(
      prepared(
        db,
        `INSERT INTO inventory_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [id, ORGANIZATION_ID, code, name, category, brand, supplier, unit, minimum, reorder, standard, now, now],
      ),
      prepared(
        db,
        `INSERT INTO inventory_balances VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [`bal_${id}`, ORGANIZATION_ID, "wh_central", id, quantity, average, now, now],
      ),
      prepared(
        db,
        `INSERT INTO stock_ledger VALUES (?, ?, ?, ?, NULL, NULL, ?, 'OPENING', ?, ?, ?, 'Workbook opening balance', ?, ?)`,
        [`led_open_${id}`, ORGANIZATION_ID, "wh_central", id, `OPN-${code.slice(4)}`, openingQuantity, average, openingQuantity * average, DEFAULT_ACTOR, daysFromNow(-90)],
      ),
    );
  }

  const jobSeed = [
    ["job_1042", "br_dar", "tec_001", "JOB-1042", "Serengeti Breweries", "Ilala Production Plant", "REPAIR", "URGENT", "IN_PROGRESS", "Chiller circuit 2 losing pressure", -2, -1, null, null, 327500],
    ["job_1041", "br_dar", "tec_002", "JOB-1041", "Mlimani City", "Food court AHU-04", "MAINTENANCE", "HIGH", "ASSIGNED", "Quarterly AHU inspection and filter replacement", -1, 1, null, null, 99000],
    ["job_1040", "br_aru", "tec_003", "JOB-1040", "Arusha Coffee Lodge", "Guest wing - level 2", "INSTALLATION", "NORMAL", "ON_HOLD", "Install and commission 8 split AC units", -4, -1, null, null, 0],
    ["job_1039", "br_mza", "tec_004", "JOB-1039", "Rock City Mall", "Cold room CR-02", "REPAIR", "URGENT", "IN_PROGRESS", "Cold room not reaching set point", -1, 0, null, null, 327500],
    ["job_1038", "br_dar", "tec_005", "JOB-1038", "NMB Bank HQ", "Data centre - 4th floor", "MAINTENANCE", "HIGH", "COMPLETED", "Precision cooling preventive maintenance", -6, -3, -3, "Completed full service and control calibration", 0],
    ["job_1037", "br_aru", "tec_006", "JOB-1037", "Mount Meru Hotel", "Conference wing", "REPAIR", "NORMAL", "COMPLETED", "BMS thermostat communication fault", -7, -4, -5, "Replaced thermostat and recommissioned controls", 171500],
    ["job_1036", "br_dar", "tec_001", "JOB-1036", "Aga Khan Hospital", "Theatre AHU-02", "MAINTENANCE", "URGENT", "COMPLETED", "HEPA pressure alarm inspection", -9, -7, -8, "Replaced blocked pre-filter and verified pressure", 49500],
    ["job_1035", "br_mza", "tec_004", "JOB-1035", "Mwanza Airport", "Arrivals hall", "INSTALLATION", "HIGH", "COMPLETED", "Replace two cassette units", -13, -9, -10, "Installed, tested and handed over", 612000],
    ["job_1034", "br_dar", "tec_002", "JOB-1034", "Vodacom Tanzania", "Mlimani switch room", "REPAIR", "NORMAL", "COMPLETED", "High ambient temperature alarm", -15, -12, -13, "Cleaned condenser and restored airflow", 86500],
    ["job_1033", "br_aru", "tec_003", "JOB-1033", "TFA Shopping Centre", "Roof plant room", "MAINTENANCE", "NORMAL", "COMPLETED", "Monthly chiller maintenance", -18, -14, -15, "Maintenance checklist completed", 0],
    ["job_1032", "br_dar", "tec_005", "JOB-1032", "Hyatt Regency", "Kitchen extract", "REPAIR", "HIGH", "CANCELLED", "Extract fan vibration assessment", -20, -17, null, "Cancelled by customer", 0],
    ["job_1031", "br_mza", "tec_004", "JOB-1031", "Bugando Medical Centre", "Pharmacy cold room", "MAINTENANCE", "HIGH", "COMPLETED", "Cold room preventive maintenance", -22, -19, -20, "Serviced and temperature-mapped", 30250],
  ] as const;
  for (const [id, branchId, techId, code, customer, site, type, priority, status, description, loggedOffset, targetOffset, completedOffset, resolution, partsCost] of jobSeed) {
    const logged = daysFromNow(loggedOffset);
    const completed = completedOffset === null ? null : daysFromNow(completedOffset);
    seedStatements.push(
      prepared(
        db,
        `INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ORGANIZATION_ID, branchId, techId, code, customer, site, type, priority, status, description, logged, daysFromNow(targetOffset), completed, resolution, partsCost, now, now],
      ),
      prepared(
        db,
        `INSERT INTO job_status_history VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
        [`hist_${id}`, ORGANIZATION_ID, id, status, DEFAULT_ACTOR, status === "ON_HOLD" ? "Awaiting imported equipment" : null, logged],
      ),
    );
  }

  const movements = [
    ["led_201", "itm_002", "job_1042", "tec_001", "ISS-0201", "ISSUE", -1, 327500, "Emergency refrigerant issue", -1],
    ["led_202", "itm_006", "job_1041", "tec_002", "ISS-0202", "ISSUE", -2, 49500, "AHU filters", -1],
    ["led_203", "itm_004", null, null, "GRN-0118", "RECEIPT", 10, 86500, "PO-3481", -2],
    ["led_204", "itm_010", "job_1031", "tec_004", "ISS-0200", "ISSUE", -1, 30250, "Fault replacement", -3],
    ["led_205", "itm_007", "job_1037", "tec_006", "ISS-0199", "ISSUE", -1, 171500, "Controls replacement", -5],
    ["led_206", "itm_009", null, null, "GRN-0117", "RECEIPT", 40, 8050, "Supplier invoice JRS-908", -6],
    ["led_207", "itm_008", "job_1035", "tec_004", "ISS-0198", "ISSUE", -2, 306000, "Cassette fan motor replacement", -10],
    ["led_208", "itm_006", "job_1036", "tec_001", "ISS-0197", "ISSUE", -1, 49500, "Theatre AHU pre-filter", -8],
    ["led_209", "itm_004", "job_1034", "tec_002", "ISS-0196", "ISSUE", -1, 86500, "Condenser contactor replacement", -13],
  ] as const;
  for (const [id, itemId, jobId, technicianId, code, type, delta, unitCost, reference, offset] of movements) {
    seedStatements.push(
      prepared(
        db,
        `INSERT INTO stock_ledger VALUES (?, ?, 'wh_central', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ORGANIZATION_ID, itemId, jobId, technicianId, code, type, delta, unitCost, Math.abs(delta) * unitCost, reference, DEFAULT_ACTOR, daysFromNow(offset)],
      ),
    );
  }

  const auditSeed = [
    ["aud_1", "POST", "StockIssue", "ISS-0201", "Posted emergency issue to JOB-1042", -1],
    ["aud_2", "STATUS_CHANGE", "Job", "JOB-1040", "Placed job on hold", -1],
    ["aud_3", "POST", "StockReceipt", "GRN-0118", "Posted receipt for electrical stock", -2],
    ["aud_4", "COMPLETE", "Job", "JOB-1038", "Completed precision cooling maintenance", -3],
  ];
  for (const [id, action, entityType, entityId, detail, offset] of auditSeed) {
    seedStatements.push(
      prepared(
        db,
        `INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
        [id, ORGANIZATION_ID, DEFAULT_ACTOR, action, entityType, entityId, JSON.stringify({ detail }), `req_seed_${id}`, daysFromNow(Number(offset))],
      ),
    );
  }

  await db.batch(seedStatements);
}

type Row = Record<string, unknown>;

function rows<T extends Row>(result: D1Result<T>): T[] {
  return result.results ?? [];
}

export async function getOperationsSnapshot() {
  const db = getRuntimeDatabase();
  await ensureDatabase(db);
  const [
    organizationResult,
    branchResult,
    warehouseResult,
    technicianResult,
    itemResult,
    jobResult,
    movementResult,
    auditResult,
  ] = await db.batch([
    db.prepare("SELECT * FROM organizations WHERE id = ?").bind(ORGANIZATION_ID),
    db.prepare("SELECT * FROM branches WHERE organization_id = ? ORDER BY name").bind(ORGANIZATION_ID),
    db.prepare("SELECT * FROM warehouses WHERE organization_id = ? ORDER BY name").bind(ORGANIZATION_ID),
    db.prepare(`
      SELECT t.*, b.name AS branch_name
      FROM technicians t JOIN branches b ON b.id = t.branch_id
      WHERE t.organization_id = ? ORDER BY t.name
    `).bind(ORGANIZATION_ID),
    db.prepare(`
      SELECT i.*, b.quantity, b.average_cost, b.version, w.name AS warehouse_name
      FROM inventory_items i
      JOIN inventory_balances b ON b.item_id = i.id
      JOIN warehouses w ON w.id = b.warehouse_id
      WHERE i.organization_id = ? ORDER BY i.code
    `).bind(ORGANIZATION_ID),
    db.prepare(`
      SELECT j.*, b.name AS branch_name, t.name AS technician_name
      FROM jobs j
      JOIN branches b ON b.id = j.branch_id
      LEFT JOIN technicians t ON t.id = j.technician_id
      WHERE j.organization_id = ? ORDER BY j.logged_at DESC
    `).bind(ORGANIZATION_ID),
    db.prepare(`
      SELECT l.*, i.code AS item_code, i.name AS item_name, t.name AS technician_name
      FROM stock_ledger l
      JOIN inventory_items i ON i.id = l.item_id
      LEFT JOIN technicians t ON t.id = l.technician_id
      WHERE l.organization_id = ? AND l.movement_type != 'OPENING'
      ORDER BY l.created_at DESC LIMIT 50
    `).bind(ORGANIZATION_ID),
    db.prepare(`
      SELECT * FROM audit_logs WHERE organization_id = ?
      ORDER BY created_at DESC LIMIT 40
    `).bind(ORGANIZATION_ID),
  ]);

  const organization = rows(organizationResult as D1Result<Row>)[0];
  const branches = rows(branchResult as D1Result<Row>);
  const warehouses = rows(warehouseResult as D1Result<Row>);
  const rawTechnicians = rows(technicianResult as D1Result<Row>);
  const rawItems = rows(itemResult as D1Result<Row>);
  const jobs = rows(jobResult as D1Result<Row>);
  const movements = rows(movementResult as D1Result<Row>);
  const audits = rows(auditResult as D1Result<Row>);
  const criticalFactor = Number(organization?.critical_factor ?? 0.5);

  const items = rawItems.map((item) => ({
    ...item,
    health: inventoryHealth(
      Number(item.quantity),
      Number(item.minimum_stock),
      criticalFactor,
    ),
    value: Number(item.quantity) * Number(item.average_cost),
  }));

  const maxCompleted = Math.max(
    0,
    ...rawTechnicians.map((technician) =>
      jobs.filter(
        (job) =>
          job.technician_id === technician.id && job.status === "COMPLETED",
      ).length,
    ),
  );

  const technicians = rawTechnicians.map((technician) => {
    const assignedJobs = jobs.filter(
      (job) =>
        job.technician_id === technician.id && job.status !== "CANCELLED",
    );
    const completedJobs = assignedJobs.filter(
      (job) => job.status === "COMPLETED",
    );
    const onTimeJobs = completedJobs.filter(
      (job) =>
        job.completed_at &&
        new Date(String(job.completed_at)) <= new Date(String(job.target_at)),
    );
    return {
      ...technician,
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
  });

  return {
    generatedAt: nowIso(),
    organization,
    branches,
    warehouses,
    technicians,
    items,
    jobs,
    movements,
    audits,
  };
}

type ActionPayload = {
  action?: string;
  actor?: string;
  [key: string]: unknown;
};

function requiredString(payload: ActionPayload, key: string) {
  const value = String(payload[key] ?? "").trim();
  if (!value) throw new ValidationError(`${key} is required`, key);
  return value;
}

function requiredPositiveNumber(payload: ActionPayload, key: string) {
  const value = Number(payload[key]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new ValidationError(`${key} must be greater than zero`, key);
  }
  return value;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code = "VALIDATION_ERROR",
  ) {
    super(message);
  }
}

async function existingIdempotentResponse(
  db: D1Database,
  key: string | null,
) {
  if (!key) return null;
  const row = await db
    .prepare(
      "SELECT response_json FROM idempotency_keys WHERE key = ? AND organization_id = ?",
    )
    .bind(key, ORGANIZATION_ID)
    .first<{ response_json: string }>();
  return row ? JSON.parse(row.response_json) : null;
}

export async function performOperation(
  payload: ActionPayload,
  idempotencyKey: string | null,
) {
  const db = getRuntimeDatabase();
  await ensureDatabase(db);
  const action = requiredString(payload, "action");
  const actor = String(payload.actor ?? DEFAULT_ACTOR);
  const replay = await existingIdempotentResponse(db, idempotencyKey);
  if (replay) return { ...replay, idempotentReplay: true };

  if (action === "createJob") {
    const row = await db
      .prepare("SELECT COUNT(*) AS count FROM jobs WHERE organization_id = ?")
      .bind(ORGANIZATION_ID)
      .first<{ count: number }>();
    const id = `job_${crypto.randomUUID()}`;
    const code = generateCode("JOB", 1043 + Number(row?.count ?? 0) - 12);
    const loggedAt = String(payload.loggedAt ?? nowIso());
    const targetAt = new Date(loggedAt);
    targetAt.setUTCDate(targetAt.getUTCDate() + 3);
    const job = {
      id,
      code,
      branchId: requiredString(payload, "branchId"),
      technicianId: requiredString(payload, "technicianId"),
      customer: requiredString(payload, "customer"),
      site: requiredString(payload, "site"),
      type: requiredString(payload, "type"),
      priority: requiredString(payload, "priority"),
      description: requiredString(payload, "description"),
      loggedAt,
      targetAt: targetAt.toISOString(),
      status: "ASSIGNED",
    };
    const now = nowIso();
    const response = { ok: true, action, job };
    const statements = [
      prepared(
        db,
        `INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', ?, ?, ?, NULL, NULL, 0, ?, ?)`,
        [id, ORGANIZATION_ID, job.branchId, job.technicianId, code, job.customer, job.site, job.type, job.priority, job.description, loggedAt, job.targetAt, now, now],
      ),
      prepared(
        db,
        `INSERT INTO job_status_history VALUES (?, ?, ?, NULL, 'ASSIGNED', ?, 'Initial assignment', ?)`,
        [`hist_${crypto.randomUUID()}`, ORGANIZATION_ID, id, actor, now],
      ),
      auditStatement(db, actor, "CREATE", "Job", code, null, job),
    ];
    if (idempotencyKey) statements.push(idempotencyStatement(db, idempotencyKey, action, response));
    await db.batch(statements);
    return response;
  }

  if (action === "createItem") {
    const row = await db
      .prepare("SELECT COUNT(*) AS count FROM inventory_items WHERE organization_id = ?")
      .bind(ORGANIZATION_ID)
      .first<{ count: number }>();
    const sequence = Number(row?.count ?? 0) + 1;
    const id = `itm_${crypto.randomUUID()}`;
    const code = generateCode("ITM", sequence);
    const openingQuantity = Number(payload.openingQuantity ?? 0);
    const standardCost = requiredPositiveNumber(payload, "standardCost");
    const now = nowIso();
    const item = {
      id,
      code,
      name: requiredString(payload, "name"),
      category: requiredString(payload, "category"),
      brand: requiredString(payload, "brand"),
      supplier: requiredString(payload, "supplier"),
      unit: requiredString(payload, "unit"),
      minimumStock: requiredPositiveNumber(payload, "minimumStock"),
      reorderQuantity: requiredPositiveNumber(payload, "reorderQuantity"),
      standardCost,
      openingQuantity,
    };
    const response = { ok: true, action, item };
    const statements = [
      prepared(
        db,
        `INSERT INTO inventory_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [id, ORGANIZATION_ID, code, item.name, item.category, item.brand, item.supplier, item.unit, item.minimumStock, item.reorderQuantity, standardCost, now, now],
      ),
      prepared(
        db,
        `INSERT INTO inventory_balances VALUES (?, ?, 'wh_central', ?, ?, ?, 1, ?, ?)`,
        [`bal_${crypto.randomUUID()}`, ORGANIZATION_ID, id, openingQuantity, standardCost, now, now],
      ),
      prepared(
        db,
        `INSERT INTO stock_ledger VALUES (?, ?, 'wh_central', ?, NULL, NULL, ?, 'OPENING', ?, ?, ?, 'Opening balance', ?, ?)`,
        [`led_${crypto.randomUUID()}`, ORGANIZATION_ID, id, `OPN-${code.slice(4)}`, openingQuantity, standardCost, openingQuantity * standardCost, actor, now],
      ),
      auditStatement(db, actor, "CREATE", "InventoryItem", code, null, item),
    ];
    if (idempotencyKey) statements.push(idempotencyStatement(db, idempotencyKey, action, response));
    await db.batch(statements);
    return response;
  }

  if (action === "postReceipt" || action === "postIssue") {
    const itemId = requiredString(payload, "itemId");
    const quantity = requiredPositiveNumber(payload, "quantity");
    const balance = await db
      .prepare(`
        SELECT b.*, i.code AS item_code, i.name AS item_name
        FROM inventory_balances b JOIN inventory_items i ON i.id = b.item_id
        WHERE b.organization_id = ? AND b.warehouse_id = ? AND b.item_id = ?
      `)
      .bind(ORGANIZATION_ID, "wh_central", itemId)
      .first<Row>();
    if (!balance) throw new ValidationError("Inventory item was not found", "itemId", "NOT_FOUND");
    const beforeQuantity = Number(balance.quantity);
    const currentAverage = Number(balance.average_cost);
    const isReceipt = action === "postReceipt";
    if (!isReceipt && beforeQuantity < quantity) {
      throw new ValidationError(
        `Available quantity is ${beforeQuantity} but ${quantity} was requested.`,
        "quantity",
        "INSUFFICIENT_STOCK",
      );
    }
    const unitCost = isReceipt
      ? requiredPositiveNumber(payload, "unitCost")
      : currentAverage;
    const afterQuantity = isReceipt
      ? beforeQuantity + quantity
      : beforeQuantity - quantity;
    const afterAverage = isReceipt
      ? weightedAverageCost(beforeQuantity, currentAverage, quantity, unitCost)
      : currentAverage;
    const movementCode = generateCode(
      isReceipt ? "GRN" : "ISS",
      Date.now() % 10000,
    );
    const movementId = `led_${crypto.randomUUID()}`;
    const jobId = isReceipt ? null : String(payload.jobId ?? "") || null;
    const technicianId = isReceipt
      ? null
      : String(payload.technicianId ?? "") || null;
    const now = nowIso();
    const response = {
      ok: true,
      action,
      status: "POSTED",
      code: movementCode,
      totalCost: quantity * unitCost,
      balanceChange: {
        itemId,
        before: beforeQuantity,
        after: afterQuantity,
      },
    };
    const statements = [
      prepared(
        db,
        `UPDATE inventory_balances
         SET quantity = ?, average_cost = ?, version = version + 1, updated_at = ?
         WHERE id = ? AND version = ?`,
        [afterQuantity, afterAverage, now, balance.id, balance.version],
      ),
      prepared(
        db,
        `INSERT INTO stock_ledger VALUES (?, ?, 'wh_central', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [movementId, ORGANIZATION_ID, itemId, jobId, technicianId, movementCode, isReceipt ? "RECEIPT" : "ISSUE", isReceipt ? quantity : -quantity, unitCost, quantity * unitCost, String(payload.reference ?? ""), actor, now],
      ),
      auditStatement(
        db,
        actor,
        "POST",
        isReceipt ? "StockReceipt" : "StockIssue",
        movementCode,
        { quantity: beforeQuantity },
        { quantity: afterQuantity, itemId },
      ),
    ];
    if (jobId && !isReceipt) {
      statements.push(
        prepared(
          db,
          `UPDATE jobs SET parts_cost = parts_cost + ?, updated_at = ? WHERE id = ?`,
          [quantity * unitCost, now, jobId],
        ),
      );
    }
    if (idempotencyKey) statements.push(idempotencyStatement(db, idempotencyKey, action, response));
    const results = await db.batch(statements);
    if (Number(results[0].meta.changes ?? 0) !== 1) {
      throw new ValidationError(
        "Inventory changed while posting. Refresh and retry safely.",
        undefined,
        "CONFLICT",
      );
    }
    return response;
  }

  if (action === "updateJobStatus") {
    const jobId = requiredString(payload, "jobId");
    const toStatus = requiredString(payload, "status") as JobStatus;
    const job = await db
      .prepare("SELECT * FROM jobs WHERE id = ? AND organization_id = ?")
      .bind(jobId, ORGANIZATION_ID)
      .first<Row>();
    if (!job) throw new ValidationError("Job was not found", "jobId", "NOT_FOUND");
    const fromStatus = String(job.status) as JobStatus;
    if (!canTransitionJob(fromStatus, toStatus)) {
      throw new ValidationError(
        `A job cannot move from ${fromStatus} to ${toStatus}.`,
        "status",
        "INVALID_STATUS_TRANSITION",
      );
    }
    const resolution =
      toStatus === "COMPLETED" ? requiredString(payload, "resolution") : null;
    const now = nowIso();
    const response = { ok: true, action, jobId, fromStatus, toStatus };
    const statements = [
      prepared(
        db,
        `UPDATE jobs
         SET status = ?, completed_at = ?, resolution = COALESCE(?, resolution),
             updated_at = ? WHERE id = ?`,
        [toStatus, toStatus === "COMPLETED" ? now : null, resolution, now, jobId],
      ),
      prepared(
        db,
        `INSERT INTO job_status_history VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`hist_${crypto.randomUUID()}`, ORGANIZATION_ID, jobId, fromStatus, toStatus, actor, String(payload.reason ?? "") || null, now],
      ),
      auditStatement(
        db,
        actor,
        "STATUS_CHANGE",
        "Job",
        String(job.code),
        { status: fromStatus },
        { status: toStatus, resolution },
      ),
    ];
    if (idempotencyKey) statements.push(idempotencyStatement(db, idempotencyKey, action, response));
    await db.batch(statements);
    return response;
  }

  throw new ValidationError(`Unsupported action: ${action}`, "action");
}

function auditStatement(
  db: D1Database,
  actor: string,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  return prepared(
    db,
    `INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `aud_${crypto.randomUUID()}`,
      ORGANIZATION_ID,
      actor,
      action,
      entityType,
      entityId,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      `req_${crypto.randomUUID()}`,
      nowIso(),
    ],
  );
}

function idempotencyStatement(
  db: D1Database,
  key: string,
  action: string,
  response: unknown,
) {
  return prepared(
    db,
    `INSERT INTO idempotency_keys VALUES (?, ?, ?, ?, ?)`,
    [key, ORGANIZATION_ID, action, JSON.stringify(response), nowIso()],
  );
}
