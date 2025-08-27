import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import KanbanBoard from "@/components/task/kanban-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Users, Target } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const { data: myTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks/my-tasks"],
    retry: false,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Get the first project and its main board for demo
  const currentProject = projects?.[0];
  const currentBoard = currentProject ? { id: 'main-board', projectId: currentProject.id } : null;

  const completedTasks = myTasks?.filter(task => task.status === 'done')?.length || 0;
  const inProgressTasks = myTasks?.filter(task => task.status === 'in_progress')?.length || 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          title={currentProject?.name || "Dashboard"}
          subtitle={currentProject ? "Climate Action Project" : "Welcome to Guardians CMS"}
          sdgNumber={currentProject ? "13" : undefined}
        />

        <div className="flex-1 overflow-auto">
          {currentProject && currentBoard ? (
            <KanbanBoard boardId={currentBoard.id} />
          ) : (
            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-projects">
                      {projects?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active SDG projects
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                    <CheckCircle className="h-4 w-4 text-hero-green" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-hero-green" data-testid="text-completed-tasks">
                      {completedTasks}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tasks finished this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-hero-blue" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-hero-blue" data-testid="text-in-progress-tasks">
                      {inProgressTasks}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currently active tasks
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-hero-purple" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-hero-purple" data-testid="text-team-members">
                      8
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active community heroes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded animate-pulse mb-1"></div>
                            <div className="h-3 bg-muted rounded animate-pulse w-1/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activities?.length ? (
                    <div className="space-y-4">
                      {activities.slice(0, 5).map((activity, index) => (
                        <div key={activity.id} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium" data-testid={`text-activity-${index}`}>
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.createdAt!).toRelative?.() || 'Recently'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                      <p className="text-sm text-muted-foreground">Start working on tasks to see activity here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Start */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Create Your First Project</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Start organizing your SDG-focused work with project boards
                      </p>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Join a Team</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Collaborate with other guardians on existing projects
                      </p>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Explore SDGs</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Learn about the 17 Sustainable Development Goals
                      </p>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
