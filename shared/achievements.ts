// Achievement Types and Badges Configuration

export enum AchievementCategory {
  ENROLLMENT = "enrollment",
  PROGRESS = "progress",
  COMPLETION = "completion",
  ENGAGEMENT = "engagement",
  PERFORMANCE = "performance",
  STREAK = "streak",
}

export enum AchievementTier {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum",
  DIAMOND = "diamond",
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  points: number;
  unlockCriteria: string;
  isSecret?: boolean;
}

// Achievement definitions
export const achievements: Achievement[] = [
  // Enrollment Achievements
  {
    id: 'first-course-enrollment',
    title: 'First Steps',
    description: 'Enrolled in your first course',
    category: AchievementCategory.ENROLLMENT,
    tier: AchievementTier.BRONZE,
    icon: 'footprints',
    points: 10,
    unlockCriteria: 'Enroll in any course',
  },
  {
    id: 'specialist-program-enrollment',
    title: 'Specialist Path',
    description: 'Enrolled in a specialist program',
    category: AchievementCategory.ENROLLMENT,
    tier: AchievementTier.SILVER,
    icon: 'route',
    points: 20,
    unlockCriteria: 'Enroll in any specialist program',
  },
  {
    id: 'multi-course-enrollment',
    title: 'Lifelong Learner',
    description: 'Enrolled in 5 different courses',
    category: AchievementCategory.ENROLLMENT,
    tier: AchievementTier.GOLD,
    icon: 'book-open',
    points: 50,
    unlockCriteria: 'Enroll in 5 different courses',
  },

  // Progress Achievements
  {
    id: 'first-module-completion',
    title: 'Module Master',
    description: 'Completed your first course module',
    category: AchievementCategory.PROGRESS,
    tier: AchievementTier.BRONZE,
    icon: 'check-circle',
    points: 15,
    unlockCriteria: 'Complete a course module',
  },
  {
    id: 'half-course-progress',
    title: 'Halfway There',
    description: 'Reached 50% completion in any course',
    category: AchievementCategory.PROGRESS,
    tier: AchievementTier.SILVER,
    icon: 'gauge',
    points: 25,
    unlockCriteria: 'Reach 50% completion in any course',
  },
  {
    id: 'speed-learner',
    title: 'Speed Learner',
    description: 'Completed a module in record time',
    category: AchievementCategory.PROGRESS,
    tier: AchievementTier.GOLD,
    icon: 'timer',
    points: 40,
    unlockCriteria: 'Complete a module faster than 90% of students',
    isSecret: true,
  },

  // Completion Achievements
  {
    id: 'first-course-completion',
    title: 'Course Graduate',
    description: 'Completed your first course',
    category: AchievementCategory.COMPLETION,
    tier: AchievementTier.SILVER,
    icon: 'award',
    points: 50,
    unlockCriteria: 'Complete any course',
  },
  {
    id: 'specialist-program-completion',
    title: 'Specialist Graduate',
    description: 'Completed a full specialist program',
    category: AchievementCategory.COMPLETION,
    tier: AchievementTier.GOLD,
    icon: 'trophy',
    points: 100,
    unlockCriteria: 'Complete a specialist program',
  },
  {
    id: 'multi-completion',
    title: 'Master Scholar',
    description: 'Completed 5 courses',
    category: AchievementCategory.COMPLETION,
    tier: AchievementTier.PLATINUM,
    icon: 'graduation-cap',
    points: 150,
    unlockCriteria: 'Complete 5 different courses',
  },

  // Engagement Achievements
  {
    id: 'first-discussion',
    title: 'Conversation Starter',
    description: 'Made your first discussion post',
    category: AchievementCategory.ENGAGEMENT,
    tier: AchievementTier.BRONZE,
    icon: 'message-circle',
    points: 10,
    unlockCriteria: 'Post in a course discussion',
  },
  {
    id: 'helpful-peer',
    title: 'Helpful Peer',
    description: 'Received 5 "helpful" ratings on your comments',
    category: AchievementCategory.ENGAGEMENT,
    tier: AchievementTier.SILVER,
    icon: 'helping-hand',
    points: 30,
    unlockCriteria: 'Get 5 "helpful" ratings on your comments',
  },
  {
    id: 'community-leader',
    title: 'Community Leader',
    description: 'Made 25 valuable contributions to course discussions',
    category: AchievementCategory.ENGAGEMENT,
    tier: AchievementTier.GOLD,
    icon: 'users',
    points: 75,
    unlockCriteria: 'Make 25 valuable contributions to discussions',
  },

  // Performance Achievements
  {
    id: 'perfect-quiz',
    title: 'Perfect Score',
    description: 'Got 100% on a quiz or assessment',
    category: AchievementCategory.PERFORMANCE,
    tier: AchievementTier.SILVER,
    icon: 'target',
    points: 25,
    unlockCriteria: 'Score 100% on any quiz or assessment',
  },
  {
    id: 'exam-ace',
    title: 'Exam Ace',
    description: 'Scored 90% or higher on a final exam',
    category: AchievementCategory.PERFORMANCE,
    tier: AchievementTier.GOLD,
    icon: 'medal',
    points: 75,
    unlockCriteria: 'Score 90% or higher on a final exam',
  },
  {
    id: 'top-performer',
    title: 'Top Performer',
    description: 'Ranked in the top 10% of a course',
    category: AchievementCategory.PERFORMANCE,
    tier: AchievementTier.PLATINUM,
    icon: 'crown',
    points: 100,
    unlockCriteria: 'Rank in the top 10% of a course',
  },

  // Streak Achievements
  {
    id: 'week-streak',
    title: 'Week Warrior',
    description: 'Logged in and made progress for 7 consecutive days',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.BRONZE,
    icon: 'calendar-check',
    points: 20,
    unlockCriteria: 'Log in and make progress for 7 consecutive days',
  },
  {
    id: 'month-streak',
    title: 'Monthly Devotion',
    description: 'Logged in and made progress for 30 consecutive days',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.GOLD,
    icon: 'flame',
    points: 100,
    unlockCriteria: 'Log in and make progress for 30 consecutive days',
  },
  {
    id: 'consistency-king',
    title: 'Consistency Champion',
    description: 'Maintained a study schedule for 3 months',
    category: AchievementCategory.STREAK,
    tier: AchievementTier.DIAMOND,
    icon: 'sparkles',
    points: 200,
    unlockCriteria: 'Maintain a consistent study schedule for 3 months',
  },
];

// Get achievement by ID
export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find(achievement => achievement.id === id);
}

// Get achievements by category
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return achievements.filter(achievement => achievement.category === category);
}

// Get achievements by tier
export function getAchievementsByTier(tier: AchievementTier): Achievement[] {
  return achievements.filter(achievement => achievement.tier === tier);
}

// Get hidden achievements (for admin purposes)
export function getSecretAchievements(): Achievement[] {
  return achievements.filter(achievement => achievement.isSecret);
}

// Get public achievements (shown to users in achievement gallery)
export function getPublicAchievements(): Achievement[] {
  return achievements.filter(achievement => !achievement.isSecret);
}