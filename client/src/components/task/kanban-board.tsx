import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TaskCard from "./task-card";
import { Task } from "@shared/schema";

interface KanbanBoardProps {
  boardId: string;
}

interface BoardColumn {
  id: string;
  name: string;
  status: string;
  count: number;
  color: string;
}

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/boards", boardId, "tasks"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex space-x-6 h-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <div className="bg-card rounded-lg shadow-sm border border-border h-full animate-pulse">
                <div className="p-4 border-b border-border">
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-8"></div>
                </div>
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-32 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const columns: BoardColumn[] = [
    { id: 'todo', name: 'To Do', status: 'todo', count: 0, color: 'bg-muted' },
    { id: 'in_progress', name: 'In Progress', status: 'in_progress', count: 0, color: 'bg-hero-blue' },
    { id: 'review', name: 'Review', status: 'review', count: 0, color: 'bg-yellow-500' },
    { id: 'done', name: 'Done', status: 'done', count: 0, color: 'bg-hero-green' },
  ];

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {});

  // Update column counts
  columns.forEach(column => {
    column.count = tasksByStatus[column.status]?.length || 0;
  });

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex space-x-6 h-full min-w-max">
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" data-testid={`text-column-${column.id}`}>
                    {column.name}
                  </CardTitle>
                  <Badge 
                    className={`${column.color} text-white px-2 py-1 text-sm`}
                    data-testid={`badge-column-count-${column.id}`}
                  >
                    {column.count}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {tasksByStatus[column.status]?.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      data-testid={`task-card-${task.id}`}
                    />
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No tasks in {column.name.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
