import { Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PointsDisplayProps {
  points: number;
  level: number;
  trend?: 'up' | 'down' | 'stable';
  recentEarned?: number;
}

export default function PointsDisplay({ 
  points, 
  level, 
  trend = 'stable', 
  recentEarned 
}: PointsDisplayProps) {
  const nextLevelPoints = level * 100; // Simple level calculation
  const currentLevelProgress = points % 100;

  return (
    <Card className="bg-gradient-to-r from-hero-gold to-yellow-400 text-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span className="text-sm font-medium">Guardian Points</span>
          </div>
          {trend === 'up' && <TrendingUp className="w-4 h-4" />}
        </div>
        
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-2xl font-bold" data-testid="text-total-points">
            {points.toLocaleString()}
          </span>
          <span className="text-sm opacity-80">points</span>
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Level {level}
          </Badge>
          
          {recentEarned && recentEarned > 0 && (
            <span className="text-xs opacity-90">
              +{recentEarned} this week
            </span>
          )}
        </div>
        
        {/* Progress to next level */}
        <div className="mt-3">
          <div className="flex justify-between text-xs opacity-80 mb-1">
            <span>Progress to Level {level + 1}</span>
            <span>{currentLevelProgress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentLevelProgress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
