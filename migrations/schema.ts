import { pgTable, foreignKey, varchar, text, timestamp, integer, index, jsonb, boolean, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const projectVisibility = pgEnum("project_visibility", ['public', 'private'])
export const taskPriority = pgEnum("task_priority", ['low', 'medium', 'high', 'urgent'])
export const taskStatus = pgEnum("task_status", ['todo', 'in_progress', 'review', 'done'])
export const taskType = pgEnum("task_type", ['task', 'bug', 'feature', 'challenge'])
export const userRole = pgEnum("user_role", ['super_admin', 'admin', 'project_manager', 'member', 'guest'])


export const projects = pgTable("projects", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	visibility: projectVisibility().default('public').notNull(),
	sdgTags: text("sdg_tags").array(),
	ownerId: varchar("owner_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "projects_owner_id_users_id_fk"
		}),
]);

export const projectMembers = pgTable("project_members", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	projectId: varchar("project_id").notNull(),
	userId: varchar("user_id").notNull(),
	role: varchar().default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_members_project_id_projects_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "project_members_user_id_users_id_fk"
		}),
]);

export const taskComments = pgTable("task_comments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskId: varchar("task_id").notNull(),
	userId: varchar("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_comments_task_id_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "task_comments_user_id_users_id_fk"
		}),
]);

export const tasks = pgTable("tasks", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	type: taskType().default('task').notNull(),
	priority: taskPriority().default('medium').notNull(),
	status: taskStatus().default('todo').notNull(),
	boardId: varchar("board_id").notNull(),
	assigneeId: varchar("assignee_id"),
	reporterId: varchar("reporter_id").notNull(),
	labels: text().array(),
	estimationHours: integer("estimation_hours"),
	rewardPoints: integer("reward_points").default(100).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	sdgLink: varchar("sdg_link"),
	progress: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.boardId],
			foreignColumns: [boards.id],
			name: "tasks_board_id_boards_id_fk"
		}),
	foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "tasks_assignee_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [users.id],
			name: "tasks_reporter_id_users_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const taskDependencies = pgTable("task_dependencies", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	taskId: varchar("task_id").notNull(),
	dependsOnTaskId: varchar("depends_on_task_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_dependencies_task_id_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.dependsOnTaskId],
			foreignColumns: [tasks.id],
			name: "task_dependencies_depends_on_task_id_tasks_id_fk"
		}),
]);

export const userBadges = pgTable("user_badges", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	badgeId: varchar("badge_id").notNull(),
	earnedAt: timestamp("earned_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_badges_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.badgeId],
			foreignColumns: [badges.id],
			name: "user_badges_badge_id_badges_id_fk"
		}),
]);

export const boards = pgTable("boards", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	projectId: varchar("project_id").notNull(),
	columns: jsonb().default([{"id":"todo","name":"To Do","order":0},{"id":"in_progress","name":"In Progress","order":1},{"id":"review","name":"Review","order":2},{"id":"done","name":"Done","order":3}]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "boards_project_id_projects_id_fk"
		}),
]);

export const badges = pgTable("badges", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	icon: varchar(),
	criteria: jsonb(),
	pointsRequired: integer("points_required"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const activities = pgTable("activities", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	type: varchar().notNull(),
	description: text().notNull(),
	metadata: jsonb(),
	projectId: varchar("project_id"),
	taskId: varchar("task_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activities_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "activities_project_id_projects_id_fk"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "activities_task_id_tasks_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	role: userRole().default('member').notNull(),
	bio: text(),
	country: varchar(),
	sdgAlignment: text("sdg_alignment").array(),
	points: integer().default(0).notNull(),
	level: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);
