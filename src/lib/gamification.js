/**
 * GAMIFICATION SYSTEM - Complete Learning Motivation Engine
 * 
 * Features:
 * - Activity-based XP system (words, studying, achievements)
 * - 50+ level progression with Spanish titles
 * - Daily streak tracking with bonuses
 * - 20+ achievements and badges
 * - Word mastery levels (0-5)
 * - Daily challenges
 * - Perfect for Spanish language learning
 */

import * as GamificationV2 from './gamification-v2';

// ============================================================================
// LEGACY COMPATIBILITY & ENHANCED STATS
// ============================================================================

// Calculate XP required for a specific level
export const xpRequiredForLevel = (level) => {
  return GamificationV2.xpRequiredForLevel(level);
};

// Calculate current level and progress from total XP
export const getLevelFromXP = (totalXP) => {
  return GamificationV2.getLevelFromXP(totalXP);
};

// Calculate consecutive days
export const calculateConsecutiveDays = (words = []) => {
  return GamificationV2.calculateConsecutiveDays(words);
};

// Main stats calculation (enhanced)
export const calculateStats = (words = []) => {
  const totalXP = words.reduce((sum, w) => sum + (w.earnedXP || 10), 0);
  const levelInfo = getLevelFromXP(totalXP);
  const streak = calculateConsecutiveDays(words);
  
  return {
    // Core progression
    level: levelInfo.level,
    title: levelInfo.title,
    tierColor: levelInfo.tierColor,
    totalXP: levelInfo.totalXP,
    currentLevelXP: levelInfo.currentLevelXP,
    xpForNextLevel: levelInfo.xpForNextLevel,
    progressPercent: levelInfo.progressPercent,
    
    // Streaks
    streak,
    streakMilestones: GamificationV2.getStreakMilestones(streak),
    
    // Content
    wordCount: words.length,
    
    // Achievements
    achievements: GamificationV2.checkAchievements({
      wordCount: words.length,
      streak,
      level: levelInfo.level,
      totalXP: levelInfo.totalXP,
    }),
  };
};

// ============================================================================
// NEW FEATURES
// ============================================================================

// Get all available achievements
export const getAllAchievements = () => GamificationV2.ACHIEVEMENTS;

// Get mastery info for a word
export const getWordMastery = (word) => GamificationV2.calculateMastery(word);

// Get daily challenges
export const getDailyChallenges = (userProfile) => GamificationV2.generateDailyChallenges(userProfile);

// Calculate XP for an activity
export const calculateActivityXP = (activity, details) => GamificationV2.calculateActivityXP(activity, details);

// Comprehensive stats
export const getComprehensiveStats = (words, studySessions, userProfile) => {
  return GamificationV2.calculateComprehensiveStats(words, studySessions, userProfile);
};