import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("TZS"),
  timezone: text("timezone").notNull().default("Africa/Dar_es_Salaam"),
  criticalFactor: real("critical_factor").notNull().default(0.5),
  targetTurnaroundDays: integer("target_turnaround_days").notNull().default(3),
  ...timestamps,
});

export const branches = sqliteTable("branches", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const warehouses = sqliteTable("warehouses", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  branchId: text("branch_id").notNull(),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const technicians = sqliteTable("technicians", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  branchId: text("branch_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  position: text("position").notNull(),
  primarySkill: text("primary_skill").notNull(),
  employmentStatus: text("employment_status").notNull().default("ACTIVE"),
  joinedAt: text("joined_at").notNull(),
  ...timestamps,
});

export const inventoryItems = sqliteTable("inventory_items", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  supplier: text("supplier").notNull(),
  unit: text("unit").notNull(),
  minimumStock: real("minimum_stock").notNull(),
  reorderQuantity: real("reorder_quantity").notNull(),
  standardCost: real("standard_cost").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const inventoryBalances = sqliteTable("inventory_balances", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  warehouseId: text("warehouse_id").notNull(),
  itemId: text("item_id").notNull(),
  quantity: real("quantity").notNull().default(0),
  averageCost: real("average_cost").notNull().default(0),
  version: integer("version").notNull().default(1),
  ...timestamps,
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  branchId: text("branch_id").notNull(),
  technicianId: text("technician_id"),
  code: text("code").notNull(),
  customer: text("customer").notNull(),
  site: text("site").notNull(),
  type: text("type").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  description: text("description").notNull(),
  loggedAt: text("logged_at").notNull(),
  targetAt: text("target_at").notNull(),
  completedAt: text("completed_at"),
  resolution: text("resolution"),
  partsCost: real("parts_cost").notNull().default(0),
  ...timestamps,
});

export const jobStatusHistory = sqliteTable("job_status_history", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  jobId: text("job_id").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actor: text("actor").notNull(),
  reason: text("reason"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const stockLedger = sqliteTable("stock_ledger", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  warehouseId: text("warehouse_id").notNull(),
  itemId: text("item_id").notNull(),
  jobId: text("job_id"),
  technicianId: text("technician_id"),
  code: text("code").notNull(),
  movementType: text("movement_type").notNull(),
  quantityDelta: real("quantity_delta").notNull(),
  unitCost: real("unit_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  reference: text("reference"),
  actor: text("actor").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  requestId: text("request_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  objectKey: text("object_key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const idempotencyKeys = sqliteTable("idempotency_keys", {
  key: text("key").primaryKey(),
  organizationId: text("organization_id").notNull(),
  action: text("action").notNull(),
  responseJson: text("response_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
