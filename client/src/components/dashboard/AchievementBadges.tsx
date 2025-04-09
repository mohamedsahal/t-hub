import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  Award,
  Badge,
  Loader2,
  BookOpen,
  Route,
  CheckCircle,
  Timer,
  Crown,
  MessageCircle,
  Target,
  HelpingHand,
  Users,
  Medal,
  Gauge,
  Flame,
  Sparkles,
  CalendarCheck,
  Footprints
} from "lucide-react";

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge as UIBadge } from "@/components/ui/badge";
import { AchievementCategory, AchievementTier, Achievement } from "@shared/achievements";

// Map achievement icons to Lucide components
const achievementIcons: Record<string, React.ReactNode> = {
  "footprints": <Footprints className="h-8 w-8" />,
  "route": <Route className="h-8 w-8" />,
  "book-open": <BookOpen className="h-8 w-8" />,
  "check-circle": <CheckCircle className="h-8 w-8" />,
  "gauge": <Gauge className="h-8 w-8" />,
  "timer": <Timer className="h-8 w-8" />,
  "award": <Award className="h-8 w-8" />,
  "trophy": <Award className="h-8 w-8" />,
  "graduation-cap": <Award className="h-8 w-8" />,
  "message-circle": <MessageCircle className="h-8 w-8" />,
  "helping-hand": <HelpingHand className="h-8 w-8" />,
  "users": <Users className="h-8 w-8" />,
  "target": <Target className="h-8 w-8" />,
  "medal": <Medal className="h-8 w-8" />,
  "crown": <Crown className="h-8 w-8" />,
  "calendar-check": <CalendarCheck className="h-8 w-8" />,
  "flame": <Flame className="h-8 w-8" />,
  "sparkles": <Sparkles className="h-8 w-8" />,
};

// Achievement tier styling
const tierStyles: Record<AchievementTier, { bg: string, text: string, border: string }> = {
  [AchievementTier.BRONZE]: { 
    bg: "bg-amber-50", 
    text: "text-amber-800", 
    border: "border-amber-200" 
  },
  [AchievementTier.SILVER]: { 
    bg: "bg-slate-100", 
    text: "text-slate-700", 
    border: "border-slate-300" 
  },
  [AchievementTier.GOLD]: { 
    bg: "bg-yellow-50", 
    text: "text-yellow-800", 
    border: "border-yellow-300" 
  },
  [AchievementTier.PLATINUM]: { 
    bg: "bg-indigo-50", 
    text: "text-indigo-800", 
    border: "border-indigo-200" 
  },
  [AchievementTier.DIAMOND]: { 
    bg: "bg-cyan-50", 
    text: "text-cyan-800", 
    border: "border-cyan-200" 
  },
};

// Category styling
const categoryStyles: Record<AchievementCategory, { bg: string, text: string }> = {
  [AchievementCategory.ENROLLMENT]: { bg: "bg-green-100", text: "text-green-800" },
  [AchievementCategory.PROGRESS]: { bg: "bg-blue-100", text: "text-blue-800" },
  [AchievementCategory.COMPLETION]: { bg: "bg-purple-100", text: "text-purple-800" },
  [AchievementCategory.ENGAGEMENT]: { bg: "bg-pink-100", text: "text-pink-800" },
  [AchievementCategory.PERFORMANCE]: { bg: "bg-amber-100", text: "text-amber-800" },
  [AchievementCategory.STREAK]: { bg: "bg-red-100", text: "text-red-800" },
};

// Achievement badge component
const AchievementBadge = ({ 
  achievement, 
  achieved = false, 
  progress = 0 
}: { 
  achievement: Achievement, 
  achieved?: boolean,
  progress?: number
}) => {
  const tierStyle = tierStyles[achievement.tier];
  const categoryStyle = categoryStyles[achievement.category];
  const icon = achievementIcons[achievement.icon] || <Badge className="h-8 w-8" />;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 border-2 hover:shadow-md ${achieved ? tierStyle.border : 'border-gray-200'}`}>
      {!achieved && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-50 backdrop-blur-[1px] flex items-center justify-center z-10">
          <Badge className="h-12 w-12 text-gray-500" />
        </div>
      )}
      <CardHeader className={`py-4 ${achieved ? tierStyle.bg : 'bg-gray-100'}`}>
        <div className="flex justify-between items-center">
          <UIBadge variant="outline" className={categoryStyle.bg}>
            <span className={categoryStyle.text}>{achievement.category}</span>
          </UIBadge>
          <UIBadge className={achieved ? 'bg-green-500' : 'bg-gray-300'}>
            {achievement.points} pts
          </UIBadge>
        </div>
        <div className="flex justify-center items-center pt-2">
          <div className={`rounded-full p-4 ${achieved ? tierStyle.bg : 'bg-gray-100'}`}>
            {icon}
          </div>
        </div>
        <CardTitle className="text-center mt-2 text-lg">
          {achievement.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <CardDescription className="text-center mb-4 h-16 overflow-auto">
          {achievement.description}
        </CardDescription>
        {!achieved && progress > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className={`py-3 text-xs ${achieved ? tierStyle.bg : 'bg-gray-100'}`}>
        <div className="w-full flex justify-between items-center">
          <span className={achieved ? tierStyle.text : 'text-gray-500'}>
            {achievement.tier.toUpperCase()}
          </span>
          <span className={achieved ? 'text-green-600' : 'text-gray-500'}>
            {achieved ? 'UNLOCKED' : 'LOCKED'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

// Skeleton for loading state
const AchievementSkeleton = () => (
  <Card className="border-2 border-gray-200">
    <CardHeader className="py-4 bg-gray-100 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-20 bg-gray-300 rounded-full"></div>
        <div className="h-5 w-12 bg-gray-300 rounded-full"></div>
      </div>
      <div className="flex justify-center items-center pt-4">
        <div className="h-16 w-16 bg-gray-300 rounded-full"></div>
      </div>
      <div className="h-6 w-28 mx-auto bg-gray-300 rounded-full mt-2"></div>
    </CardHeader>
    <CardContent className="pt-4 animate-pulse">
      <div className="h-4 w-full bg-gray-200 rounded-full mb-2"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded-full mb-2"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded-full"></div>
    </CardContent>
    <CardFooter className="py-3 bg-gray-100 animate-pulse">
      <div className="w-full flex justify-between items-center">
        <div className="h-4 w-16 bg-gray-300 rounded-full"></div>
        <div className="h-4 w-16 bg-gray-300 rounded-full"></div>
      </div>
    </CardFooter>
  </Card>
);

// Interface for user achievements
interface UserAchievement {
  achievementId: string;
  progress: number;
  earnedAt: string;
}

// Main component
const AchievementBadges = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch the achievements from the server
  const { data: achievements = [], isLoading: isLoadingAchievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    enabled: !!userId,
  });

  // Fetch user achievements
  const { data: userAchievements = [], isLoading: isLoadingUserAchievements } = useQuery<UserAchievement[]>({
    queryKey: ["/api/user/achievements", userId],
    enabled: !!userId,
  });

  // Function to check if user has achieved a particular achievement
  const hasAchieved = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievementId === achievementId);
  };

  // Get progress for an achievement
  const getProgress = (achievementId: string) => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
    return userAchievement?.progress || 0;
  };

  // Filter achievements based on active tab
  const filteredAchievements = achievements.filter(achievement => {
    if (activeTab === "all") return true;
    if (activeTab === "earned") return hasAchieved(achievement.id);
    if (activeTab === "unearned") return !hasAchieved(achievement.id);
    // Filter by category if none of the above
    return achievement.category === activeTab;
  });

  const isLoading = isLoadingAchievements || isLoadingUserAchievements;
  
  // Calculate total points earned
  const totalPoints = userAchievements.reduce((total, ua) => {
    const achievement = achievements.find(a => a.id === ua.achievementId);
    return total + (achievement?.points || 0);
  }, 0);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Achievements</h2>
          <p className="text-gray-600 mt-1">
            Earn badges by completing tasks and reaching milestones.
          </p>
        </div>
        <div className="mt-4 md:mt-0 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
          <div className="flex items-center">
            <Award className="mr-2 h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-xl font-bold">{totalPoints}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid grid-cols-3 md:flex md:flex-wrap gap-1">
            <TabsTrigger value="all" className="px-4 py-2 rounded-md">All</TabsTrigger>
            <TabsTrigger value="earned" className="px-4 py-2 rounded-md">Earned</TabsTrigger>
            <TabsTrigger value="unearned" className="px-4 py-2 rounded-md">Unearned</TabsTrigger>
            <TabsTrigger value={AchievementCategory.ENROLLMENT} className="px-4 py-2 rounded-md">Enrollment</TabsTrigger>
            <TabsTrigger value={AchievementCategory.PROGRESS} className="px-4 py-2 rounded-md">Progress</TabsTrigger>
            <TabsTrigger value={AchievementCategory.COMPLETION} className="px-4 py-2 rounded-md">Completion</TabsTrigger>
            <TabsTrigger value={AchievementCategory.ENGAGEMENT} className="px-4 py-2 rounded-md">Engagement</TabsTrigger>
            <TabsTrigger value={AchievementCategory.PERFORMANCE} className="px-4 py-2 rounded-md">Performance</TabsTrigger>
            <TabsTrigger value={AchievementCategory.STREAK} className="px-4 py-2 rounded-md">Streak</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="pt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <AchievementSkeleton key={i} />
              ))}
            </div>
          ) : filteredAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAchievements.map((achievement) => (
                <AchievementBadge 
                  key={achievement.id} 
                  achievement={achievement} 
                  achieved={hasAchieved(achievement.id)}
                  progress={getProgress(achievement.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Badge className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-700">No achievements found</h3>
              <p className="text-gray-500 text-center mt-2 max-w-md">
                {activeTab === "earned" 
                  ? "You haven't earned any achievements yet. Complete tasks to earn badges!"
                  : "No achievements match the selected filter."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <TooltipProvider>
        <div className="bg-gray-50 p-6 rounded-lg mt-8">
          <h3 className="text-xl font-bold mb-4">Achievement Tiers</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.values(AchievementTier).map((tier) => {
              const style = tierStyles[tier];
              return (
                <Tooltip key={tier}>
                  <TooltipTrigger asChild>
                    <div className={`${style.bg} ${style.border} border-2 rounded-lg p-4 flex flex-col items-center cursor-help`}>
                      <Award className={`h-8 w-8 ${style.text} mb-2`} />
                      <span className={`font-medium ${style.text}`}>{tier.toUpperCase()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</p>
                    <p className="text-sm">
                      {tier === AchievementTier.BRONZE && "Entry-level achievements. Easy to earn."}
                      {tier === AchievementTier.SILVER && "Moderate achievements requiring consistent effort."}
                      {tier === AchievementTier.GOLD && "Significant accomplishments showing dedication."}
                      {tier === AchievementTier.PLATINUM && "Advanced achievements for committed learners."}
                      {tier === AchievementTier.DIAMOND && "Elite achievements for exceptional dedication."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default AchievementBadges;