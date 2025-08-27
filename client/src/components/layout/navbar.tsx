import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, UserPlus } from "lucide-react";
import { getSDGByNumber } from "@/lib/sdg-data";

interface NavbarProps {
  title: string;
  subtitle?: string;
  sdgNumber?: string;
  onCreateTask?: () => void;
  onInviteMembers?: () => void;
}

export default function Navbar({ 
  title, 
  subtitle, 
  sdgNumber, 
  onCreateTask, 
  onInviteMembers 
}: NavbarProps) {
  const sdg = sdgNumber ? getSDGByNumber(parseInt(sdgNumber)) : null;

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          
          {sdg && (
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: sdg.color === 'bg-green-700' ? '#15803d' : '#6b7280' }}
              >
                <span className="text-xs font-bold text-white">{sdg.number}</span>
              </div>
              <span className="text-sm text-muted-foreground">{sdg.title}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
            >
              3
            </Badge>
          </Button>
          
          {/* Quick Actions */}
          {onCreateTask && (
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onCreateTask}
              data-testid="button-create-task"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          )}
          
          {onInviteMembers && (
            <Button 
              className="bg-hero-green text-white hover:bg-hero-green/90"
              onClick={onInviteMembers}
              data-testid="button-invite-members"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Heroes
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
