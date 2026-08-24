INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `kind`, `created_by_user_id`, `created_at`, `updated_at`)
SELECT
	'personal:' || `id`,
	COALESCE(NULLIF(trim(`name`), ''), `email`) || '''s workspace',
	'personal',
	`id`,
	`created_at`,
	`updated_at`
FROM `users`;--> statement-breakpoint
INSERT OR IGNORE INTO `workspace_members` (`workspace_id`, `user_id`, `role`, `status`, `created_at`, `updated_at`)
SELECT
	'personal:' || `id`,
	`id`,
	'owner',
	'active',
	`created_at`,
	`updated_at`
FROM `users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_operation_records` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`review_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_operation_records`("id", "workspace_id", "title", "summary", "status", "priority", "review_at", "created_at", "updated_at") SELECT "id", 'personal:' || "user_id", "title", "summary", "status", "priority", "review_at", "created_at", "updated_at" FROM `operation_records`;--> statement-breakpoint
DROP TABLE `operation_records`;--> statement-breakpoint
ALTER TABLE `__new_operation_records` RENAME TO `operation_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `operation_records_workspace_id_idx` ON `operation_records` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `operation_records_workspace_status_idx` ON `operation_records` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `operation_records_workspace_priority_idx` ON `operation_records` (`workspace_id`,`priority`);--> statement-breakpoint
CREATE INDEX `operation_records_workspace_review_at_idx` ON `operation_records` (`workspace_id`,`review_at`);--> statement-breakpoint
CREATE INDEX `operation_records_workspace_updated_at_idx` ON `operation_records` (`workspace_id`,`updated_at`);
