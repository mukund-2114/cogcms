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
    let query = db.select().from(activities);
    
    if (projectId) {
      query = query.where(eq(activities.projectId, projectId));
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
}

export const storage = new DatabaseStorage();
