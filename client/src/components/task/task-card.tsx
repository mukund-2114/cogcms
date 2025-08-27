import { Task } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Paperclip, MessageCircle, CheckCircle, Clock, Trophy } from "lucide-react";
import { getSDGByNumber } from "@/lib/sdg-data";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  className?: string;
}

export default function TaskCard({ task, className }: TaskCardProps) {
  const sdg = task.sdgLink ? getSDGByNumber(parseInt(task.sdgLink)) : null;
  
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    urgent: 'bg-red-200 text-red-900'
  };

  const typeIcons = {
    task: '📋',
    bug: '🐛', 
    feature: '✨',
    challenge: '🎯'
  };

  const isCompleted = task.status === 'done';

  return (
    <Card 
      className={cn(
        "task-card cursor-pointer transition-all duration-200 hover:shadow-md",
        isCompleted && "opacity-75",
        className
      )}
      data-testid={`task-card-${task.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className={cn(
            "font-medium text-foreground text-sm",
            isCompleted && "line-through"
          )}>
            <span className="mr-2">{typeIcons[task.type]}</span>
            {task.title}
          </h4>
          <div className="flex items-center space-x-1">
            <Badge 
              variant="secondary" 
              className="bg-hero-gold text-white text-xs px-2 py-1"
              data-testid={`badge-points-${task.id}`}
            >
              {isCompleted ? `+${task.rewardPoints}` : `${task.rewardPoints}`} pts
            </Badge>
            {isCompleted && (
              <CheckCircle className="w-4 h-4 text-hero-green" />
            )}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
        
        {/* Progress bar for in-progress tasks */}
        {task.status === 'in_progress' && task.progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        )}

        {/* Review status */}
        {task.status === 'review' && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
            <div className="flex items-center space-x-2">
              <Clock className="text-yellow-600 w-3 h-3" />
              <span className="text-xs text-yellow-700">Waiting for review</span>
            </div>
          </div>
        )}

        {/* Completion status */}
        {isCompleted && (
          <div className="mb-3 bg-green-50 border border-green-200 rounded p-2">
            <div className="flex items-center space-x-2">
              <Trophy className="text-green-600 w-3 h-3" />
              <span className="text-xs text-green-700">
                Completed • +{task.rewardPoints} points earned
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {/* SDG Link */}
          <div className="flex items-center space-x-2">
            {sdg ? (
              <>
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: sdg.color === 'bg-green-700' ? '#15803d' : '#6b7280' }}
                >
                  <span className="text-xs font-bold text-white">{sdg.number}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {sdg.title}
                </span>
              </>
            ) : (
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">?</span>
              </div>
            )}
          </div>
          
          {/* Assignee and Priority */}
          <div className="flex items-center space-x-2">
            {/* Attachments indicator */}
            <Paperclip className="w-3 h-3 text-muted-foreground" />
            
            {/* Comments indicator */}
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3 text-hero-blue" />
              <span className="text-xs text-muted-foreground">3</span>
            </div>
            
            {/* Assignee avatar - placeholder for now */}
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">
                {task.assigneeId ? 'U' : '?'}
              </AvatarFallback>
            </Avatar>
            
            {/* Priority badge */}
            <Badge 
              variant="secondary" 
              className={cn("text-xs px-2 py-1", priorityColors[task.priority])}
              data-testid={`badge-priority-${task.id}`}
            >
              {task.priority}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
