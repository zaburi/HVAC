CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`request_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`key` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`action` text NOT NULL,
	`response_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_balances` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`average_cost` real DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`brand` text NOT NULL,
	`supplier` text NOT NULL,
	`unit` text NOT NULL,
	`minimum_stock` real NOT NULL,
	`reorder_quantity` real NOT NULL,
	`standard_cost` real NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`job_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`actor` text NOT NULL,
	`reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`technician_id` text,
	`code` text NOT NULL,
	`customer` text NOT NULL,
	`site` text NOT NULL,
	`type` text NOT NULL,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`description` text NOT NULL,
	`logged_at` text NOT NULL,
	`target_at` text NOT NULL,
	`completed_at` text,
	`resolution` text,
	`parts_cost` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency` text DEFAULT 'TZS' NOT NULL,
	`timezone` text DEFAULT 'Africa/Dar_es_Salaam' NOT NULL,
	`critical_factor` real DEFAULT 0.5 NOT NULL,
	`target_turnaround_days` integer DEFAULT 3 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`warehouse_id` text NOT NULL,
	`item_id` text NOT NULL,
	`job_id` text,
	`technician_id` text,
	`code` text NOT NULL,
	`movement_type` text NOT NULL,
	`quantity_delta` real NOT NULL,
	`unit_cost` real NOT NULL,
	`total_cost` real NOT NULL,
	`reference` text,
	`actor` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `technicians` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`position` text NOT NULL,
	`primary_skill` text NOT NULL,
	`employment_status` text DEFAULT 'ACTIVE' NOT NULL,
	`joined_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `warehouses` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
