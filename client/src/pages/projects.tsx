import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import CreateProjectModal from "@/components/modals/create-project-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FolderKanban, Plus, Users, CheckCircle, Clock, Settings, Trash2 } from "lucide-react";
import { getSDGByNumber } from "@/lib/sdg-data";
import { Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Projects() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
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

  const handleDeleteProject = async (project: Project) => {
    if (project.ownerId !== user?.id && !user?.role) {
      toast({
        title: "Error",
        description: "You don't have permission to delete this project",
        variant: "destructive",
      });
      return;
    }
    
    if (project.ownerId !== user?.id && !['admin', 'super_admin'].includes(user.role)) {
      toast({
        title: "Error", 
        description: "You don't have permission to delete this project",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          title="My Projects"
          subtitle="Manage your SDG-focused projects and collaborate with other guardians"
          onCreateTask={() => setShowCreateModal(true)}
          onInviteMembers={() => {}}
        />

        <div className="flex-1 overflow-auto p-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Projects</h1>
              <p className="text-muted-foreground">
                {projects.length} active projects contributing to the SDGs
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-project"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: Project) => {
                const sdgs = project.sdgTags || [];
                const isOwner = project.ownerId === user?.id;
                const canDelete = isOwner || ['admin', 'super_admin'].includes(user?.role || '');

                return (
                  <Card key={project.id} className="hover:shadow-md transition-shadow" data-testid={`project-card-${project.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1" data-testid={`text-project-title-${project.id}`}>
                            {project.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description || "No description provided"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Badge variant="outline" className={project.visibility === 'public' ? 'text-hero-green' : 'text-muted-foreground'}>
                            {project.visibility}
                          </Badge>
                        </div>
                      </div>

                      {/* SDG Tags */}
                      {sdgs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sdgs.slice(0, 3).map(sdgId => {
                            const sdg = getSDGByNumber(parseInt(sdgId));
                            if (!sdg) return null;
                            
                            return (
                              <div 
                                key={sdgId}
                                className="flex items-center space-x-1 text-xs"
                                title={sdg.title}
                              >
                                <div 
                                  className="w-4 h-4 rounded-sm flex items-center justify-center text-white font-bold text-xs"
                                  style={{ backgroundColor: sdg.color === 'bg-green-700' ? '#15803d' : '#6b7280' }}
                                >
                                  {sdg.number}
                                </div>
                                <span className="text-muted-foreground truncate max-w-20">{sdg.title}</span>
                              </div>
                            );
                          })}
                          {sdgs.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{sdgs.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </CardHeader>

                    <CardContent>
                      {/* Project Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-hero-green" />
                          <div>
                            <p className="text-sm font-medium">12</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-hero-blue" />
                          <div>
                            <p className="text-sm font-medium">8</p>
                            <p className="text-xs text-muted-foreground">In Progress</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>68%</span>
                        </div>
                        <Progress value={68} className="h-2" />
                      </div>

                      {/* Team Members */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <div className="flex -space-x-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Avatar key={i} className="w-6 h-6 border-2 border-background">
                                <AvatarFallback className="text-xs">U{i + 1}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">+5 more</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-settings-${project.id}`}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          {canDelete && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteProject(project)}
                              data-testid={`button-delete-${project.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Owner Badge */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {isOwner ? 'You own this project' : `Owned by ${project.ownerId}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(project.createdAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your journey as a Guardian by creating your first SDG-focused project
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-hero-blue hover:bg-hero-blue/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
