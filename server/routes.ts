import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { initializeAuth, generateToken, hashPassword, requireAuth, requireRole } from "./auth";
import { insertProjectSchema, insertBoardSchema, insertTaskSchema, insertBadgeSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { z } from "zod";

const setupAuth = async (app: Express) => {
  const secret = process.env.SESSION_SECRET || "dev_session_secret";
  
  app.use(
    session({
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // Initialize Passport
  initializeAuth();
  app.use(passport.initialize());
  app.use(passport.session());
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await storage.createUser({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        authProvider: 'local',
        emailVerified: false,
      });

      // Generate token
      const token = generateToken(user);

      // Store token in session
      req.session.token = token;

      res.json({ 
        message: 'User registered successfully', 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          role: user.role 
        }, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user);
      
      // Store token in session
      req.session.token = token;

      res.json({ 
        message: 'Login successful', 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          role: user.role 
        }, 
        token 
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Google OAuth routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req: any, res) => {
      // Generate token
      const token = generateToken(req.user);
      
      // Store token in session
      req.session.token = token;
      
      // Redirect to dashboard
      res.redirect('/?auth=success');
    }
  );

  // Get current user
  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        points: user.points,
        level: user.level,
        bio: user.bio,
        country: user.country,
        sdgAlignment: user.sdgAlignment,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Legacy routes for compatibility (remove these if not needed)
  app.post('/api/login', (req, res) => {
    res.status(410).json({ message: 'Please use /api/auth/login instead' });
  });

  app.post('/api/signup', (req, res) => {
    res.status(410).json({ message: 'Please use /api/auth/register instead' });
  });

  // Project routes
  app.get('/api/projects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', requireAuth, async (req, res) => {
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

  app.post('/api/projects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.put('/api/projects/:id', requireAuth, async (req, res) => {
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

  app.delete('/api/projects/:id', requireAuth, async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Board routes
  app.get('/api/projects/:projectId/boards', requireAuth, async (req, res) => {
    try {
      const boards = await storage.getBoardsByProject(req.params.projectId);
      res.json(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  app.post('/api/projects/:projectId/boards', requireAuth, async (req, res) => {
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
  app.get('/api/boards/:boardId/tasks', requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksByBoard(req.params.boardId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/my-tasks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tasks = await storage.getTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });

  app.post('/api/boards/:boardId/tasks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.put('/api/tasks/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Badge routes
  app.get('/api/badges', requireAuth, async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post('/api/badges', requireAuth, requireRole(['admin', 'super_admin']), async (req: any, res) => {
    try {
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

  app.get('/api/users/:userId/badges', requireAuth, async (req, res) => {
    try {
      const userBadges = await storage.getUserBadges(req.params.userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  app.post('/api/users/:userId/badges/:badgeId', requireAuth, requireRole(['admin', 'super_admin']), async (req: any, res) => {
    try {
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
  app.get('/api/projects/:projectId/members', requireAuth, async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.projectId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  // Activity routes
  app.get('/api/activities', requireAuth, async (req, res) => {
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
  app.get('/api/admin/users', requireAuth, requireRole(['admin', 'super_admin']), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:userId/role', requireAuth, requireRole(['admin', 'super_admin']), async (req: any, res) => {
    try {
      const { role } = req.body;
      const updatedUser = await storage.updateUserRole(req.params.userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', requireAuth, async (req, res) => {
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

  // Advanced Task Management Routes (Jira-like functionality)

  // Task Comments
  app.get('/api/tasks/:taskId/comments', requireAuth, async (req, res) => {
    try {
      const comments = await storage.getTaskComments(req.params.taskId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching task comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/tasks/:taskId/comments', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const comment = await storage.createTaskComment({
        taskId: req.params.taskId,
        userId,
        content: content.trim()
      });

      // Log activity
      await storage.createActivity({
        userId,
        type: 'comment_added',
        description: `Added comment to task`,
        taskId: req.params.taskId,
        metadata: { commentId: comment.id }
      });

      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.put('/api/comments/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { content } = req.body;
      const comment = await storage.getTaskComment(req.params.id);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this comment" });
      }

      const updatedComment = await storage.updateTaskComment(req.params.id, { content });
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete('/api/comments/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const comment = await storage.getTaskComment(req.params.id);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }

      await storage.deleteTaskComment(req.params.id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Time Tracking
  app.post('/api/tasks/:taskId/time-logs', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { timeSpent, description, date } = req.body;
      
      if (!timeSpent || timeSpent <= 0) {
        return res.status(400).json({ message: "Valid time spent is required" });
      }
      
      const timeLog = await storage.createTimeLog({
        taskId: req.params.taskId,
        userId,
        timeSpent: parseFloat(timeSpent),
        description,
        date: date ? new Date(date) : new Date()
      });

      res.json(timeLog);
    } catch (error) {
      console.error("Error creating time log:", error);
      res.status(500).json({ message: "Failed to log time" });
    }
  });

  app.get('/api/tasks/:taskId/time-logs', requireAuth, async (req, res) => {
    try {
      const timeLogs = await storage.getTaskTimeLogs(req.params.taskId);
      res.json(timeLogs);
    } catch (error) {
      console.error("Error fetching time logs:", error);
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  // Task Assignment
  app.put('/api/tasks/:id/assign', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { assigneeId } = req.body;
      
      const task = await storage.updateTask(req.params.id, { assigneeId });
      
      if (assigneeId) {
        // Log activity
        await storage.createActivity({
          userId,
          type: 'task_assigned',
          description: `Assigned task "${task.title}" to user`,
          taskId: task.id,
          metadata: { taskTitle: task.title, assigneeId }
        });
      }

      res.json(task);
    } catch (error) {
      console.error("Error assigning task:", error);
      res.status(500).json({ message: "Failed to assign task" });
    }
  });

  // Advanced Search and Filtering
  app.get('/api/tasks/search', requireAuth, async (req: any, res) => {
    try {
      const {
        query,
        assigneeId,
        reporterId,
        status,
        priority,
        type,
        projectId,
        limit = 50,
        offset = 0
      } = req.query;

      const tasks = await storage.searchTasks({
        query,
        assigneeId,
        reporterId,
        status,
        priority,
        type,
        projectId,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(tasks);
    } catch (error) {
      console.error("Error searching tasks:", error);
      res.status(500).json({ message: "Failed to search tasks" });
    }
  });

  // Task Status Transitions
  app.put('/api/tasks/:id/transition', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { status, comment } = req.body;
      
      const oldTask = await storage.getTask(req.params.id);
      const task = await storage.updateTask(req.params.id, { status });
      
      // Log status transition
      await storage.createActivity({
        userId,
        type: 'status_changed',
        description: `Changed task status from ${oldTask?.status} to ${status}`,
        taskId: task.id,
        metadata: { 
          oldStatus: oldTask?.status, 
          newStatus: status,
          comment: comment || null
        }
      });

      // Award points if task completed
      if (oldTask?.status !== 'done' && status === 'done' && task.assigneeId) {
        const assignee = await storage.getUser(task.assigneeId);
        if (assignee) {
          const newPoints = assignee.points + task.rewardPoints;
          await storage.updateUserPoints(task.assigneeId, newPoints);

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
      console.error("Error transitioning task:", error);
      res.status(500).json({ message: "Failed to transition task" });
    }
  });

  // Task Labels/Tags
  app.put('/api/tasks/:id/labels', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { labels } = req.body;
      const task = await storage.updateTask(req.params.id, { labels });
      
      // Log activity
      await storage.createActivity({
        userId,
        type: 'labels_updated',
        description: `Updated task labels`,
        taskId: task.id,
        metadata: { labels }
      });

      res.json(task);
    } catch (error) {
      console.error("Error updating task labels:", error);
      res.status(500).json({ message: "Failed to update labels" });
    }
  });

  // Task Dependencies
  app.post('/api/tasks/:id/dependencies', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { dependsOnTaskId } = req.body;
      
      if (!dependsOnTaskId) {
        return res.status(400).json({ message: "Dependency task ID is required" });
      }
      
      const dependency = await storage.createTaskDependency({
        taskId: req.params.id,
        dependsOnTaskId
      });
      
      res.json(dependency);
    } catch (error) {
      console.error("Error creating task dependency:", error);
      res.status(500).json({ message: "Failed to create dependency" });
    }
  });

  app.get('/api/tasks/:id/dependencies', requireAuth, async (req, res) => {
    try {
      const dependencies = await storage.getTaskDependencies(req.params.id);
      res.json(dependencies);
    } catch (error) {
      console.error("Error fetching task dependencies:", error);
      res.status(500).json({ message: "Failed to fetch dependencies" });
    }
  });

  // Get single task with full details
  app.get('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}