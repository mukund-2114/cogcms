import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { SDG_DATA } from "@/lib/sdg-data";
import { FolderKanban, Globe, Lock, X } from "lucide-react";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  sdgTags: z.array(z.string()).default([]),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "public",
      sdgTags: [],
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      onOpenChange(false);
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
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  const selectedSDGs = form.watch('sdgTags') || [];

  const toggleSDG = (sdgId: string) => {
    const current = selectedSDGs;
    const newSelection = current.includes(sdgId)
      ? current.filter(id => id !== sdgId)
      : [...current, sdgId];
    form.setValue('sdgTags', newSelection);
  };

  const removeSDG = (sdgId: string) => {
    const newSelection = selectedSDGs.filter(id => id !== sdgId);
    form.setValue('sdgTags', newSelection);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            <span>Create New Project</span>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., SDG Climate Action Project"
                      {...field}
                      data-testid="input-project-name"
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
                      placeholder="Describe your project's goals and how it contributes to the SDGs..."
                      rows={3}
                      {...field}
                      data-testid="textarea-project-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Visibility</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger data-testid="select-project-visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-hero-green" />
                            <div>
                              <span>Public</span>
                              <div className="text-xs text-muted-foreground">
                                Anyone can view and join this project
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center space-x-2">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <span>Private</span>
                              <div className="text-xs text-muted-foreground">
                                Only invited members can access this project
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SDG Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Related SDGs (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Select which Sustainable Development Goals your project addresses
              </p>
              
              {/* Selected SDGs */}
              {selectedSDGs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Selected ({selectedSDGs.length}/17)
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    {selectedSDGs.map(sdgId => {
                      const sdg = SDG_DATA.find(s => s.id === sdgId);
                      if (!sdg) return null;
                      
                      return (
                        <Badge 
                          key={sdgId} 
                          variant="secondary" 
                          className="pl-2 pr-1 py-1"
                          data-testid={`selected-sdg-${sdgId}`}
                        >
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-4 h-4 rounded-sm flex items-center justify-center text-white font-bold text-xs mr-1"
                              style={{ backgroundColor: sdg.color === 'bg-green-700' ? '#15803d' : '#6b7280' }}
                            >
                              {sdg.number}
                            </div>
                            <span className="text-xs">{sdg.title}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-1"
                              onClick={() => removeSDG(sdgId)}
                              data-testid={`remove-sdg-${sdgId}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SDG Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {SDG_DATA.map((sdg) => {
                  const isSelected = selectedSDGs.includes(sdg.id);
                  
                  return (
                    <div
                      key={sdg.id}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleSDG(sdg.id)}
                      data-testid={`sdg-option-${sdg.id}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSDG(sdg.id)}
                        className="pointer-events-none"
                      />
                      <div 
                        className="w-6 h-6 rounded-sm flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ backgroundColor: sdg.color === 'bg-green-700' ? '#15803d' : '#6b7280' }}
                      >
                        {sdg.number}
                      </div>
                      <span className="text-xs font-medium line-clamp-2">
                        {sdg.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project Preview */}
            <div className="border border-border rounded-lg p-4 bg-muted/50">
              <Label className="text-sm font-medium mb-3 block">Project Preview</Label>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">
                      {form.watch('name') || 'Project Name'}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {form.watch('description') || 'No description provided'}
                    </p>
                  </div>
                  <Badge variant="outline" className={form.watch('visibility') === 'public' ? 'text-hero-green' : 'text-muted-foreground'}>
                    {form.watch('visibility')}
                  </Badge>
                </div>
                
                {selectedSDGs.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Contributing to {selectedSDGs.length} SDG{selectedSDGs.length > 1 ? 's' : ''}
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedSDGs.slice(0, 5).map(sdgId => {
                        const sdg = SDG_DATA.find(s => s.id === sdgId);
                        if (!sdg) return null;
                        
                        return (
                          <div 
                            key={sdgId}
                            className="w-6 h-6 rounded-sm flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: sdg.color === 'bg-green-700' ? '#15803d' : '#6b7280' }}
                            title={sdg.title}
                          >
                            {sdg.number}
                          </div>
                        );
                      })}
                      {selectedSDGs.length > 5 && (
                        <span className="text-xs text-muted-foreground self-center ml-1">
                          +{selectedSDGs.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-project"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createProjectMutation.isPending}
                className="bg-hero-blue hover:bg-hero-blue/90"
                data-testid="button-save-project"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
