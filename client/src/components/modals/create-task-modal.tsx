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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { SDG_DATA } from "@/lib/sdg-data";
import { CheckSquare, Bug, Sparkles, Target } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(['task', 'bug', 'feature', 'challenge']).default('task'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  rewardPoints: z.number().min(1, "Points must be at least 1").default(100),
  sdgLink: z.string().optional(),
  estimationHours: z.number().min(0, "Hours must be positive").optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

const taskTypeOptions = [
  { value: 'task', label: 'Task', icon: CheckSquare, description: 'General work item' },
  { value: 'bug', label: 'Bug', icon: Bug, description: 'Issue or problem to fix' },
  { value: 'feature', label: 'Feature', icon: Sparkles, description: 'New functionality' },
  { value: 'challenge', label: 'Challenge', icon: Target, description: 'Community challenge' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-200 text-red-900' },
];

export default function CreateTaskModal({ open, onOpenChange, boardId }: CreateTaskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "task",
      priority: "medium",
      rewardPoints: 100,
      sdgLink: "",
      estimationHours: 0,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      await apiRequest("POST", `/api/boards/${boardId}/tasks`, {
        ...data,
        estimationHours: data.estimationHours || null,
        sdgLink: data.sdgLink || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-tasks"] });
      toast({
        title: "Success",
        description: "Task created successfully",
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
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const selectedTaskType = taskTypeOptions.find(opt => opt.value === form.watch('type'));
  const selectedPriority = priorityOptions.find(opt => opt.value === form.watch('priority'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span>Create New Task</span>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Design renewable energy campaign graphics"
                      {...field}
                      data-testid="input-task-title"
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
                      placeholder="Describe what needs to be done..."
                      rows={3}
                      {...field}
                      data-testid="textarea-task-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger data-testid="select-task-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskTypeOptions.map((option) => {
                            const IconComponent = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="w-4 h-4" />
                                  <div className="flex flex-col">
                                    <span>{option.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {option.description}
                                    </span>
                                  </div>
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger data-testid="select-task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <Badge variant="secondary" className={option.color}>
                                {option.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rewardPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Points *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                        data-testid="input-task-points"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-task-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sdgLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related SDG</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger data-testid="select-task-sdg">
                        <SelectValue placeholder="Select an SDG (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {SDG_DATA.map((sdg) => (
                          <SelectItem key={sdg.id} value={sdg.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-6 h-6 rounded-sm flex items-center justify-center text-white font-bold text-xs"
                                style={{ backgroundColor: sdg.color === 'bg-green-700' ? '#15803d' : '#6b7280' }}
                              >
                                {sdg.number}
                              </div>
                              <span>{sdg.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Preview */}
            <div className="border border-border rounded-lg p-4 bg-muted/50">
              <Label className="text-sm font-medium mb-2 block">Task Preview</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {selectedTaskType && <selectedTaskType.icon className="w-4 h-4" />}
                  <span className="font-medium">
                    {form.watch('title') || 'Task Title'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-hero-gold text-white"
                  >
                    {form.watch('rewardPoints') || 100} pts
                  </Badge>
                  {selectedPriority && (
                    <Badge variant="secondary" className={selectedPriority.color}>
                      {selectedPriority.label}
                    </Badge>
                  )}
                </div>
                {form.watch('sdgLink') && (
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const sdg = SDG_DATA.find(s => s.id === form.watch('sdgLink'));
                      if (!sdg) return null;
                      return (
                        <>
                          <div 
                            className="w-4 h-4 rounded-sm flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: sdg.color === 'bg-green-700' ? '#15803d' : '#6b7280' }}
                          >
                            {sdg.number}
                          </div>
                          <span className="text-sm text-muted-foreground">{sdg.title}</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-task"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTaskMutation.isPending}
                data-testid="button-save-task"
              >
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
