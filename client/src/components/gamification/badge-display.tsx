import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Trophy, Star, Award } from "lucide-react";
import { UserBadge, Badge as BadgeType } from "@shared/schema";

interface BadgeDisplayProps {
  userBadges: (UserBadge & { badge: BadgeType })[];
  isLoading?: boolean;
}

export default function BadgeDisplay({ userBadges, isLoading }: BadgeDisplayProps) {
  const badgeIcons = {
    trophy: Trophy,
    medal: Medal,
    star: Star,
    award: Award,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Medal className="w-5 h-5 text-hero-gold" />
          <span>Achievements</span>
          <Badge variant="secondary">{userBadges.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userBadges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {userBadges.map(({ badge, earnedAt }) => {
              const IconComponent = badgeIcons[badge.icon as keyof typeof badgeIcons] || Award;
              
              return (
                <div 
                  key={badge.id}
                  className="p-3 border rounded-lg text-center hover:shadow-md transition-shadow cursor-pointer badge-glow"
                  title={badge.description || undefined}
                  data-testid={`badge-${badge.id}`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 hero-gradient rounded-full flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-xs font-medium text-foreground mb-1">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Earned {new Date(earnedAt!).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Medal className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No badges earned yet</p>
            <p className="text-sm text-muted-foreground">Complete tasks to earn your first badge!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
