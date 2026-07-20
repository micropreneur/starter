CREATE TABLE `workspace_members` (
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`workspace_id`, `user_id`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_workspace_id_uidx` ON `workspace_members` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_members_user_id_uidx` ON `workspace_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `workspace_members_user_status_idx` ON `workspace_members` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `workspace_members_workspace_status_idx` ON `workspace_members` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'personal' NOT NULL,
	`avatar_url` text,
	`product_type` text,
	`primary_goal` text,
	`onboarding_completed_at` integer,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_created_by_user_id_uidx` ON `workspaces` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `workspaces_kind_idx` ON `workspaces` (`kind`);--> statement-breakpoint
INSERT INTO `workspaces` (`id`, `name`, `kind`, `created_by_user_id`, `created_at`, `updated_at`)
SELECT
	'personal:' || `id`,
	COALESCE(NULLIF(trim(`name`), ''), `email`) || '''s workspace',
	'personal',
	`id`,
	`created_at`,
	`updated_at`
FROM `users`;--> statement-breakpoint
INSERT INTO `workspace_members` (`workspace_id`, `user_id`, `role`, `status`, `created_at`, `updated_at`)
SELECT
	'personal:' || `id`,
	`id`,
	'owner',
	'active',
	`created_at`,
	`updated_at`
FROM `users`;
