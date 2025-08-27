import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'project_manager', 'member', 'guest']);
export const taskTypeEnum = pgEnum('task_type', ['task', 'bug', 'feature', 'challenge']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'review', 'done']);
export const projectVisibilityEnum = pgEnum('project_visibility', ['public', 'private']);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('member').notNull(),
  bio: text("bio"),
  country: varchar("country"),
  sdgAlignment: text("sdg_alignment").array(),
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  visibility: projectVisibilityEnum("visibility").default('public').notNull(),
  sdgTags: text("sdg_tags").array(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Boards table
export const boards = pgTable("boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  columns: jsonb("columns").default([
    { id: 'todo', name: 'To Do', order: 0 },
    { id: 'in_progress', name: 'In Progress', order: 1 },
    { id: 'review', name: 'Review', order: 2 },
    { id: 'done', name: 'Done', order: 3 }
  ]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: taskTypeEnum("type").default('task').notNull(),
  priority: taskPriorityEnum("priority").default('medium').notNull(),
  status: taskStatusEnum("status").default('todo').notNull(),
  boardId: varchar("board_id").references(() => boards.id).notNull(),
  assigneeId: varchar("assignee_id").references(() => users.id),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  labels: text("labels").array(),
  estimationHours: integer("estimation_hours"),
  rewardPoints: integer("reward_points").default(100).notNull(),
  dueDate: timestamp("due_date"),
  sdgLink: varchar("sdg_link"), // SDG number (1-17)
  progress: integer("progress").default(0).notNull(), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task dependencies
export const taskDependencies = pgTable("task_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  dependsOnTaskId: varchar("depends_on_task_id").references(() => tasks.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Badges table
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon"), // Font Awesome icon class
  criteria: jsonb("criteria"), // Rules for earning the badge
  pointsRequired: integer("points_required"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges (many-to-many)
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeId: varchar("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Project members (many-to-many)
export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").default('member').notNull(), // project-specific role
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Task comments
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity log
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // 'task_created', 'task_completed', 'badge_earned', etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional data
  projectId: varchar("project_id").references(() => projects.id),
  taskId: varchar("task_id").references(() => tasks.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  assignedTasks: many(tasks, { relationName: "assignee" }),
  reportedTasks: many(tasks, { relationName: "reporter" }),
  badges: many(userBadges),
  projectMemberships: many(projectMembers),
  comments: many(taskComments),
  activities: many(activities),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  boards: many(boards),
  members: many(projectMembers),
  activities: many(activities),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  project: one(projects, {
    fields: [boards.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  board: one(boards, {
    fields: [tasks.boardId],
    references: [boards.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  reporter: one(users, {
    fields: [tasks.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  comments: many(taskComments),
  dependencies: many(taskDependencies, { relationName: "task" }),
  dependents: many(taskDependencies, { relationName: "dependsOn" }),
  activities: many(activities),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

// Zod schemas
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoardSchema = createInsertSchema(boards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Board = typeof boards.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
