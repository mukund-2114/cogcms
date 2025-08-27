import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Medal, Plus, Trophy, Star, Award, Shield, Target, Crown } from "lucide-react";
import { Badge as BadgeType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const badgeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  pointsRequired: z.number().min(0, "Points must be positive").optional(),
  isActive: z.boolean().default(true),
});

type BadgeFormData = z.infer<typeof badgeSchema>;

const iconOptions = [
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "medal", label: "Medal", icon: Medal },
  { value: "star", label: "Star", icon: Star },
  { value: "award", label: "Award", icon: Award },
  { value: "shield", label: "Shield", icon: Shield },
  { value: "target", label: "Target", icon: Target },
  { value: "crown", label: "Crown", icon: Crown },
];

export default function AdminBadges() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<BadgeFormData>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "medal",
      pointsRequired: 0,
      isActive: true,
    },
  });

  // Redirect if not authenticated or not admin
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
    
    if (!isLoading && user && user.role && !['admin', 'super_admin'].includes(user.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ["/api/badges"],
    retry: false,
  });

  const createBadgeMutation = useMutation({
    mutationFn: async (data: BadgeFormData) => {
      await apiRequest("POST", "/api/badges", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      toast({
        title: "Success",
        description: "Badge created successfully",
      });
      setShowCreateModal(false);
      form.reset();
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
        description: "Failed to create badge",
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

  if (user && user.role && !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
                <p className="text-muted-foreground">
                  You don't have permission to access the admin panel.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onSubmit = (data: BadgeFormData) => {
    createBadgeMutation.mutate(data);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          title="Badge Management"
          subtitle="Create and manage achievement badges for community members"
        />

        <div className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Badges</h1>
              <p className="text-muted-foreground">
                {badges.length} achievement badges available
              </p>
            </div>
            
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-hero-gold hover:bg-hero-gold/90"
                  data-testid="button-create-badge"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Badge</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Badge Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Climate Hero"
                              {...field}
                              data-testid="input-badge-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what this badge represents..."
                              {...field}
                              data-testid="textarea-badge-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger data-testid="select-badge-icon">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {iconOptions.map((option) => {
                                  const IconComponent = option.icon;
                                  return (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center space-x-2">
                                        <IconComponent className="w-4 h-4" />
                                        <span>{option.label}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pointsRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Required (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-badge-points"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active Badge</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Whether this badge can be earned by users
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-badge-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowCreateModal(false)}
                        data-testid="button-cancel-badge"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createBadgeMutation.isPending}
                        data-testid="button-save-badge"
                      >
                        {createBadgeMutation.isPending ? "Creating..." : "Create Badge"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Badges Grid */}
          {badgesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-6 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : badges.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {badges.map((badge: BadgeType) => {
                const iconOption = iconOptions.find(opt => opt.value === badge.icon);
                const IconComponent = iconOption?.icon || Medal;

                return (
                  <Card key={badge.id} className="text-center hover:shadow-md transition-shadow" data-testid={`badge-card-${badge.id}`}>
                    <CardHeader>
                      <div className="w-16 h-16 mx-auto hero-gradient rounded-full flex items-center justify-center mb-4 badge-glow">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-lg" data-testid={`text-badge-name-${badge.id}`}>
                        {badge.name}
                      </CardTitle>
                      {badge.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {badge.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {badge.pointsRequired && badge.pointsRequired > 0 && (
                          <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{badge.pointsRequired} points required</span>
                          </div>
                        )}
                        
                        <div className="flex justify-center">
                          <Badge 
                            variant={badge.isActive ? "default" : "secondary"}
                            className={badge.isActive ? "bg-hero-green" : ""}
                            data-testid={`badge-status-${badge.id}`}
                          >
                            {badge.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Created {new Date(badge.createdAt!).toLocaleDateString()}
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
                <Medal className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Badges Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first achievement badge to start recognizing community contributions
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-hero-gold hover:bg-hero-gold/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Badge
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
