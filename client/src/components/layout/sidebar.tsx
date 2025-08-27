import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  Shield, 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Trophy, 
  Medal,
  Users,
  Settings,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SDG_DATA } from "@/lib/sdg-data";

interface SidebarItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string | number;
  isActive?: boolean;
}

function SidebarItem({ href, icon: Icon, label, badge, isActive }: SidebarItemProps) {
  return (
    <Link href={href}>
      <a className={cn(
        "sidebar-item flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive 
          ? "bg-accent text-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )} data-testid={`link-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        {badge && (
          <Badge variant="secondary" className="ml-auto bg-hero-green text-white text-xs px-2 py-0.5">
            {badge}
          </Badge>
        )}
      </a>
    </Link>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: myTasks = [] } = useQuery({
    queryKey: ["/api/tasks/my-tasks"],
    retry: false,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const taskCount = myTasks.length;
  const projectCount = projects.length;

  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 hero-gradient rounded-lg flex items-center justify-center">
            <Shield className="text-white text-lg w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Guardians CMS</h1>
            <p className="text-xs text-muted-foreground">Task & Community Hub</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profileImageUrl || undefined} alt={`${user?.firstName} ${user?.lastName}`} />
            <AvatarFallback>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-user-name">
              {user?.firstName || ''} {user?.lastName || ''}
            </p>
            <p className="text-xs text-muted-foreground capitalize" data-testid="text-user-role">
              {user?.role?.replace('_', ' ') || 'member'}
            </p>
          </div>
        </div>
        
        {/* Points and Level Display */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="text-yellow-500 w-4 h-4" />
            <span className="text-sm font-medium" data-testid="text-user-points">
              {(user?.points || 0).toLocaleString()} pts
            </span>
          </div>
          <Badge variant="secondary" className="bg-hero-blue text-white">
            Level {user?.level || 1}
          </Badge>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <SidebarItem 
          href="/" 
          icon={LayoutDashboard} 
          label="Dashboard" 
          isActive={location === '/'}
        />
        
        <SidebarItem 
          href="/projects" 
          icon={FolderKanban} 
          label="My Projects" 
          badge={projectCount}
          isActive={location === '/projects'}
        />
        
        <SidebarItem 
          href="/tasks" 
          icon={CheckSquare} 
          label="My Tasks" 
          badge={taskCount}
          isActive={location === '/tasks'}
        />
        
        <SidebarItem 
          href="/leaderboard" 
          icon={Trophy} 
          label="Leaderboard" 
          isActive={location === '/leaderboard'}
        />
        
        <SidebarItem 
          href="/achievements" 
          icon={Medal} 
          label="Achievements" 
          isActive={location === '/achievements'}
        />

        {/* Admin-only sections */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Administration
            </h3>
            
            <SidebarItem 
              href="/admin/users" 
              icon={Users} 
              label="User Management" 
              isActive={location === '/admin/users'}
            />
            
            <SidebarItem 
              href="/admin/badges" 
              icon={Medal} 
              label="Badge Management" 
              isActive={location === '/admin/badges'}
            />
            
            <SidebarItem 
              href="/admin/settings" 
              icon={Settings} 
              label="System Settings" 
              isActive={location === '/admin/settings'}
            />
          </div>
        )}
      </nav>

      {/* SDG Quick Links */}
      <div className="p-4 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          SDG Focus Areas
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[1, 13, 4].map(number => {
            const sdg = SDG_DATA.find(s => s.number === number);
            return (
              <div 
                key={number}
                className="w-8 h-8 rounded flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: sdg?.color === 'bg-red-600' ? '#dc2626' : 
                                        sdg?.color === 'bg-green-700' ? '#15803d' : 
                                        sdg?.color === 'bg-red-700' ? '#b91c1c' : '#6b7280' }}
                title={sdg?.title}
                data-testid={`sdg-${number}`}
              >
                <span className="text-xs font-bold text-white">{number}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.location.href = "/api/logout"}
          data-testid="button-logout"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
