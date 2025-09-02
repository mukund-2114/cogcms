import { relations } from "drizzle-orm/relations";
import { users, projects, projectMembers, tasks, taskComments, boards, taskDependencies, userBadges, badges, activities } from "./schema";

export const projectsRelations = relations(projects, ({one, many}) => ({
	user: one(users, {
		fields: [projects.ownerId],
		references: [users.id]
	}),
	projectMembers: many(projectMembers),
	boards: many(boards),
	activities: many(activities),
}));

export const usersRelations = relations(users, ({many}) => ({
	projects: many(projects),
	projectMembers: many(projectMembers),
	taskComments: many(taskComments),
	tasks_assigneeId: many(tasks, {
		relationName: "tasks_assigneeId_users_id"
	}),
	tasks_reporterId: many(tasks, {
		relationName: "tasks_reporterId_users_id"
	}),
	userBadges: many(userBadges),
	activities: many(activities),
}));

export const projectMembersRelations = relations(projectMembers, ({one}) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectMembers.userId],
		references: [users.id]
	}),
}));

export const taskCommentsRelations = relations(taskComments, ({one}) => ({
	task: one(tasks, {
		fields: [taskComments.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskComments.userId],
		references: [users.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	taskComments: many(taskComments),
	board: one(boards, {
		fields: [tasks.boardId],
		references: [boards.id]
	}),
	user_assigneeId: one(users, {
		fields: [tasks.assigneeId],
		references: [users.id],
		relationName: "tasks_assigneeId_users_id"
	}),
	user_reporterId: one(users, {
		fields: [tasks.reporterId],
		references: [users.id],
		relationName: "tasks_reporterId_users_id"
	}),
	taskDependencies_taskId: many(taskDependencies, {
		relationName: "taskDependencies_taskId_tasks_id"
	}),
	taskDependencies_dependsOnTaskId: many(taskDependencies, {
		relationName: "taskDependencies_dependsOnTaskId_tasks_id"
	}),
	activities: many(activities),
}));

export const boardsRelations = relations(boards, ({one, many}) => ({
	tasks: many(tasks),
	project: one(projects, {
		fields: [boards.projectId],
		references: [projects.id]
	}),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({one}) => ({
	task_taskId: one(tasks, {
		fields: [taskDependencies.taskId],
		references: [tasks.id],
		relationName: "taskDependencies_taskId_tasks_id"
	}),
	task_dependsOnTaskId: one(tasks, {
		fields: [taskDependencies.dependsOnTaskId],
		references: [tasks.id],
		relationName: "taskDependencies_dependsOnTaskId_tasks_id"
	}),
}));

export const userBadgesRelations = relations(userBadges, ({one}) => ({
	user: one(users, {
		fields: [userBadges.userId],
		references: [users.id]
	}),
	badge: one(badges, {
		fields: [userBadges.badgeId],
		references: [badges.id]
	}),
}));

export const badgesRelations = relations(badges, ({many}) => ({
	userBadges: many(userBadges),
}));

export const activitiesRelations = relations(activities, ({one}) => ({
	user: one(users, {
		fields: [activities.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [activities.projectId],
		references: [projects.id]
	}),
	task: one(tasks, {
		fields: [activities.taskId],
		references: [tasks.id]
	}),
}));