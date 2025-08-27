import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertBoardSchema, insertTaskSchema, insertBadgeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({ ...req.body, ownerId: userId });
      const project = await storage.createProject(projectData);
      
      // Create a default board for the project
      await storage.createBoard({
        name: "Main Board",
        projectId: project.id,
        description: "Default project board"
      });

      // Log activity
      await storage.createActivity({
        userId,
        type: 'project_created',
        description: `Created project "${project.name}"`,
        projectId: project.id,
        metadata: { projectName: project.name }
      });

      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Board routes
  app.get('/api/projects/:projectId/boards', isAuthenticated, async (req, res) => {
    try {
      const boards = await storage.getBoardsByProject(req.params.projectId);
      res.json(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  app.post('/api/projects/:projectId/boards', isAuthenticated, async (req, res) => {
    try {
      const boardData = insertBoardSchema.parse({ ...req.body, projectId: req.params.projectId });
      const board = await storage.createBoard(boardData);
      res.json(board);
    } catch (error) {
      console.error("Error creating board:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid board data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create board" });
    }
  });

  // Task routes
  app.get('/api/boards/:boardId/tasks', isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getTasksByBoard(req.params.boardId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/my-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });

  app.post('/api/boards/:boardId/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTaskSchema.parse({ 
        ...req.body, 
        boardId: req.params.boardId,
        reporterId: userId
      });
      const task = await storage.createTask(taskData);

      // Log activity
      await storage.createActivity({
        userId,
        type: 'task_created',
        description: `Created task "${task.title}"`,
        taskId: task.id,
        metadata: { taskTitle: task.title }
      });

      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTaskSchema.partial().parse(req.body);
      const oldTask = await storage.getTask(req.params.id);
      const task = await storage.updateTask(req.params.id, taskData);

      // Award points if task completed
      if (oldTask?.status !== 'done' && task.status === 'done' && task.assigneeId) {
        const assignee = await storage.getUser(task.assigneeId);
        if (assignee) {
          const newPoints = assignee.points + task.rewardPoints;
          await storage.updateUserPoints(task.assigneeId, newPoints);

          // Log activity
          await storage.createActivity({
            userId: task.assigneeId,
            type: 'task_completed',
            description: `Completed task "${task.title}" and earned ${task.rewardPoints} points`,
            taskId: task.id,
            metadata: { taskTitle: task.title, pointsEarned: task.rewardPoints }
          });
        }
      }

      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Badge routes
  app.get('/api/badges', isAuthenticated, async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post('/api/badges', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const badgeData = insertBadgeSchema.parse(req.body);
      const badge = await storage.createBadge(badgeData);
      res.json(badge);
    } catch (error) {
      console.error("Error creating badge:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid badge data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  app.get('/api/users/:userId/badges', isAuthenticated, async (req, res) => {
    try {
      const userBadges = await storage.getUserBadges(req.params.userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  app.post('/api/users/:userId/badges/:badgeId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userBadge = await storage.awardBadge(req.params.userId, req.params.badgeId);
      
      // Log activity
      await storage.createActivity({
        userId: req.params.userId,
        type: 'badge_earned',
        description: `Earned a new badge`,
        metadata: { badgeId: req.params.badgeId }
      });

      res.json(userBadge);
    } catch (error) {
      console.error("Error awarding badge:", error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  // Project member routes
  app.get('/api/projects/:projectId/members', isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.projectId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  // Activity routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getActivities(projectId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:userId/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { role } = req.body;
      const updatedUser = await storage.updateUserRole(req.params.userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getLeaderboard(projectId, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
