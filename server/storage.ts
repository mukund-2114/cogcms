import {
  users,
  projects,
  boards,
  tasks,
  badges,
  userBadges,
  projectMembers,
  taskComments,
  activities,
  type User,
  type UpsertUser,
  type Project,
  type Board,
  type Task,
  type Badge,
  type UserBadge,
  type ProjectMember,
  type TaskComment,
  type Activity,
  type InsertProject,
  type InsertBoard,
  type InsertTask,
  type InsertBadge,
  type InsertActivity,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Board operations
  getBoardsByProject(projectId: string): Promise<Board[]>;
  getBoard(id: string): Promise<Board | undefined>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, board: Partial<InsertBoard>): Promise<Board>;
  
  // Task operations
  getTasksByBoard(boardId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTasksByUser(userId: string): Promise<Task[]>;
  
  // Badge operations
  getBadges(): Promise<Badge[]>;
  getBadge(id: string): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: string, badge: Partial<InsertBadge>): Promise<Badge>;
  deleteBadge(id: string): Promise<void>;
  
  // User badge operations
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userId: string, badgeId: string): Promise<UserBadge>;
  
  // Project member operations
  getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]>;
  addProjectMember(projectId: string, userId: string, role?: string): Promise<ProjectMember>;
  removeProjectMember(projectId: string, userId: string): Promise<void>;
  
  // Activity operations
  getActivities(projectId?: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // User management operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<User>;
  
  // Leaderboard operations
  getLeaderboard(projectId?: string, limit?: number): Promise<User[]>;
  
  // Advanced Task Management - Jira-like features
  // Comments
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  getTaskComment(id: string): Promise<TaskComment | undefined>;
  createTaskComment(comment: { taskId: string; userId: string; content: string }): Promise<TaskComment>;
  updateTaskComment(id: string, comment: { content: string }): Promise<TaskComment>;
  deleteTaskComment(id: string): Promise<void>;
  
  // Time tracking
  createTimeLog(timeLog: { taskId: string; userId: string; timeSpent: number; description?: string; date: Date }): Promise<any>;
  getTaskTimeLogs(taskId: string): Promise<any[]>;
  
  // Advanced search
  searchTasks(params: {
    query?: string;
    assigneeId?: string;
    reporterId?: string;
    status?: string;
    priority?: string;
    type?: string;
    projectId?: string;
    limit: number;
    offset: number;
  }): Promise<Task[]>;
  
  // Board management
  getProjectBoards(projectId: string): Promise<Board[]>;
  
  // Task dependencies
  createTaskDependency(dependency: { taskId: string; dependsOnTaskId: string }): Promise<any>;
  getTaskDependencies(taskId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(
        or(
          eq(projects.ownerId, userId),
          eq(projects.visibility, 'public')
        )
      )
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Board operations
  async getBoardsByProject(projectId: string): Promise<Board[]> {
    return await db
      .select()
      .from(boards)
      .where(eq(boards.projectId, projectId))
      .orderBy(boards.createdAt);
  }

  async getBoard(id: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    return board;
  }

  async createBoard(board: InsertBoard): Promise<Board> {
    const [newBoard] = await db.insert(boards).values(board).returning();
    return newBoard;
  }

  async updateBoard(id: string, board: Partial<InsertBoard>): Promise<Board> {
    const [updatedBoard] = await db
      .update(boards)
      .set({ ...board, updatedAt: new Date() })
      .where(eq(boards.id, id))
      .returning();
    return updatedBoard;
  }

  // Task operations
  async getTasksByBoard(boardId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.boardId, boardId))
      .orderBy(tasks.createdAt);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assigneeId, userId))
      .orderBy(desc(tasks.updatedAt));
  }

  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return await db
      .select()
      .from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(badges.name);
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async updateBadge(id: string, badge: Partial<InsertBadge>): Promise<Badge> {
    const [updatedBadge] = await db
      .update(badges)
      .set(badge)
      .where(eq(badges.id, id))
      .returning();
    return updatedBadge;
  }

  async deleteBadge(id: string): Promise<void> {
    await db.update(badges).set({ isActive: false }).where(eq(badges.id, id));
  }

  // User badge operations
  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    return await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        badge: badges,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    const [userBadge] = await db
      .insert(userBadges)
      .values({ userId, badgeId })
      .returning();
    return userBadge;
  }

  // Project member operations
  async getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]> {
    return await db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        userId: projectMembers.userId,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
        user: users,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(projectMembers.joinedAt);
  }

  async addProjectMember(projectId: string, userId: string, role = 'member'): Promise<ProjectMember> {
    const [member] = await db
      .insert(projectMembers)
      .values({ projectId, userId, role })
      .returning();
    return member;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
  }

  // Activity operations
  async getActivities(projectId?: string, limit = 50): Promise<Activity[]> {
    const query = db.select().from(activities);
    
    if (projectId) {
      return await query
        .where(eq(activities.projectId, projectId))
        .orderBy(desc(activities.createdAt))
        .limit(limit);
    }
    
    return await query
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // User management operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserPoints(userId: string, points: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        points,
        level: Math.floor(points / 100) + 1, // Simple level calculation
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Leaderboard operations
  async getLeaderboard(projectId?: string, limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.points))
      .limit(limit);
  }

  // Advanced Task Management - Jira-like features implementation
  
  // Comments
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(taskComments.createdAt);
  }

  async getTaskComment(id: string): Promise<TaskComment | undefined> {
    const [comment] = await db.select().from(taskComments).where(eq(taskComments.id, id));
    return comment;
  }

  async createTaskComment(comment: { taskId: string; userId: string; content: string }): Promise<TaskComment> {
    const [newComment] = await db
      .insert(taskComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async updateTaskComment(id: string, comment: { content: string }): Promise<TaskComment> {
    const [updatedComment] = await db
      .update(taskComments)
      .set({ content: comment.content, updatedAt: new Date() })
      .where(eq(taskComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteTaskComment(id: string): Promise<void> {
    await db.delete(taskComments).where(eq(taskComments.id, id));
  }

  // Time tracking (simplified implementation)
  async createTimeLog(timeLog: { taskId: string; userId: string; timeSpent: number; description?: string; date: Date }): Promise<any> {
    // For now, we'll add this to activities table as a workaround
    const [activity] = await db
      .insert(activities)
      .values({
        userId: timeLog.userId,
        type: 'time_logged',
        description: `Logged ${timeLog.timeSpent} hours${timeLog.description ? ': ' + timeLog.description : ''}`,
        taskId: timeLog.taskId,
        metadata: { 
          timeSpent: timeLog.timeSpent, 
          description: timeLog.description,
          date: timeLog.date.toISOString() 
        }
      })
      .returning();
    return { 
      id: activity.id, 
      taskId: timeLog.taskId, 
      userId: timeLog.userId, 
      timeSpent: timeLog.timeSpent,
      description: timeLog.description,
      date: timeLog.date,
      createdAt: activity.createdAt 
    };
  }

  async getTaskTimeLogs(taskId: string): Promise<any[]> {
    const logs = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.taskId, taskId),
          eq(activities.type, 'time_logged')
        )
      )
      .orderBy(desc(activities.createdAt));
    
    return logs.map(log => ({
      id: log.id,
      taskId: log.taskId,
      userId: log.userId,
      timeSpent: log.metadata?.timeSpent || 0,
      description: log.metadata?.description,
      date: log.metadata?.date ? new Date(log.metadata.date) : log.createdAt,
      createdAt: log.createdAt
    }));
  }

  // Advanced search
  async searchTasks(params: {
    query?: string;
    assigneeId?: string;
    reporterId?: string;
    status?: string;
    priority?: string;
    type?: string;
    projectId?: string;
    limit: number;
    offset: number;
  }): Promise<Task[]> {
    let query = db.select().from(tasks);
    const conditions = [];

    if (params.query) {
      conditions.push(
        or(
          like(tasks.title, `%${params.query}%`),
          like(tasks.description, `%${params.query}%`)
        )
      );
    }

    if (params.assigneeId) {
      conditions.push(eq(tasks.assigneeId, params.assigneeId));
    }

    if (params.reporterId) {
      conditions.push(eq(tasks.reporterId, params.reporterId));
    }

    if (params.status) {
      conditions.push(eq(tasks.status, params.status));
    }

    if (params.priority) {
      conditions.push(eq(tasks.priority, params.priority));
    }

    if (params.type) {
      conditions.push(eq(tasks.type, params.type));
    }

    if (params.projectId) {
      // Need to join with boards to filter by project
      query = db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          type: tasks.type,
          assigneeId: tasks.assigneeId,
          reporterId: tasks.reporterId,
          boardId: tasks.boardId,
          rewardPoints: tasks.rewardPoints,
          estimationHours: tasks.estimationHours,
          sdgLink: tasks.sdgLink,
          labels: tasks.labels,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .innerJoin(boards, eq(tasks.boardId, boards.id))
        .where(
          and(
            eq(boards.projectId, params.projectId),
            ...conditions
          )
        );
    } else if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(tasks.updatedAt))
      .limit(params.limit)
      .offset(params.offset);
  }

  // Board management
  async getProjectBoards(projectId: string): Promise<Board[]> {
    return await this.getBoardsByProject(projectId);
  }

  // Task dependencies (simplified implementation using activities)
  async createTaskDependency(dependency: { taskId: string; dependsOnTaskId: string }): Promise<any> {
    const [activity] = await db
      .insert(activities)
      .values({
        userId: '', // This should be filled by the calling code
        type: 'dependency_created',
        description: `Task dependency created`,
        taskId: dependency.taskId,
        metadata: { dependsOnTaskId: dependency.dependsOnTaskId }
      })
      .returning();
    
    return {
      id: activity.id,
      taskId: dependency.taskId,
      dependsOnTaskId: dependency.dependsOnTaskId,
      createdAt: activity.createdAt
    };
  }

  async getTaskDependencies(taskId: string): Promise<any[]> {
    const deps = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.taskId, taskId),
          eq(activities.type, 'dependency_created')
        )
      );
    
    return deps.map(dep => ({
      id: dep.id,
      taskId: dep.taskId,
      dependsOnTaskId: dep.metadata?.dependsOnTaskId,
      createdAt: dep.createdAt
    }));
  }
}

export const storage = new DatabaseStorage();
