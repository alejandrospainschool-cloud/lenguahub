/**
 * GAMIFICATION SYSTEM V2 - Spanish Learning Focus
 * 
 * Comprehensive system for motivation and progression tracking
 * Includes: XP, Levels, Streaks, Achievements, Challenges, Mastery
 */

// ============================================================================
// XP SYSTEM - Activity-based earnings
// ============================================================================

const XP_REWARDS = {
  // Word Bank Activities
  addWord: 10,
  addWordWithDefinition: 25,
  addWordWithExample: 35,
  
  // Study Activities
  matchSession: { base: 50, perPair: 10 },
  quizSession: { base: 50, perQuestion: 15 },
  flashcardSession: { base: 40, perWord: 8 },
  
  // Streak Bonuses
  streakBonus: (streak) => Math.min(50, 5 * Math.floor(streak / 5)),
  
  // Daily Bonus
  dailyLogin: 20,
  dailyStudyGoal: 100,
  
  // Achievements
  achievementBonus: 25,
};

export const calculateActivityXP = (activity, details = {}) => {
  switch (activity) {
    case 'addWord':
      let wordXP = XP_REWARDS.addWord;
      if (details.hasDefinition) wordXP += (XP_REWARDS.addWordWithDefinition - XP_REWARDS.addWord);
      if (details.hasExample) wordXP += (XP_REWARDS.addWordWithExample - XP_REWARDS.addWordWithDefinition);
      return wordXP;
      
    case 'matchSession':
      return XP_REWARDS.matchSession.base + 
             (details.pairsMatched || 0) * XP_REWARDS.matchSession.perPair +
             (details.perfectScore ? 50 : 0);
             
    case 'quizSession':
      return XP_REWARDS.quizSession.base + 
             (details.correctAnswers || 0) * XP_REWARDS.quizSession.perQuestion +
             (details.perfectScore ? 75 : 0);
             
    case 'flashcardSession':
      return XP_REWARDS.flashcardSession.base + 
             (details.wordsMastered || 0) * XP_REWARDS.flashcardSession.perWord;
             
    case 'dailyLogin':
      return XP_REWARDS.dailyLogin;
      
    case 'streakBonus':
      return XP_REWARDS.streakBonus(details.streak || 0);
      
    default:
      return 0;
  }
};

// ============================================================================
// LEVEL SYSTEM - Spanish proficiency tiers
// ============================================================================

const LEVEL_TIERS = [
  { level: 1, title: 'Principiante', color: '#64748b', minXP: 0 },          // Beginner (Gray)
  { level: 5, title: 'Estudiante', color: '#3b82f6', minXP: 500 },          // Student (Blue)
  { level: 10, title: 'Aprendiz', color: '#8b5cf6', minXP: 2000 },          // Learner (Purple)
  { level: 15, title: 'Hablante', color: '#06b6d4', minXP: 5000 },          // Speaker (Cyan)
  { level: 20, title: 'Académico', color: '#f59e0b', minXP: 10000 },        // Scholar (Amber)
  { level: 25, title: 'Maestro', color: '#ef4444', minXP: 20000 },          // Master (Red)
  { level: 30, title: 'Maestro de Lengua', color: '#ec4899', minXP: 40000 },// Language Master (Pink)
  { level: 50, title: 'Sabio del Español', color: '#10b981', minXP: 100000 }, // Spanish Sage (Green)
];

export const xpRequiredForLevel = (level) => {
  // Exponential scaling tailored for long-term motivation
  return Math.ceil(100 * Math.pow(level, 1.6));
};

export const getLevelFromXP = (totalXP) => {
  let level = 1;
  let accumulatedXP = 0;
  
  while (accumulatedXP + xpRequiredForLevel(level) <= totalXP) {
    accumulatedXP += xpRequiredForLevel(level);
    level++;
  }
  
  const currentLevelXP = totalXP - accumulatedXP;
  const xpForNextLevel = xpRequiredForLevel(level);
  const progressPercent = Math.round((currentLevelXP / xpForNextLevel) * 100);
  
  // Find tier/title
  let title = 'Principiante';
  let tierColor = '#64748b';
  for (let tier of [...LEVEL_TIERS].reverse()) {
    if (level >= tier.level) {
      title = tier.title;
      tierColor = tier.color;
      break;
    }
  }
  
  return {
    level,
    title,
    tierColor,
    currentLevelXP,
    xpForNextLevel,
    totalXP,
    progressPercent,
    accumulatedXP,
  };
};

// ============================================================================
// STREAK SYSTEM - Daily motivation
// ============================================================================

export const calculateConsecutiveDays = (activities = []) => {
  if (!activities.length) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today);
  
  const activeDates = new Set(
    activities.map(a => {
      if (!a.createdAt) return null;
      const d = a.createdAt.toDate?.() || new Date(a.createdAt);
      const normalized = new Date(d);
      normalized.setHours(0, 0, 0, 0);
      return normalized.toDateString();
    }).filter(d => d)
  );
  
  // Check if activity today or yesterday
  if (!activeDates.has(today.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
    if (!activeDates.has(checkDate.toDateString())) {
      return 0;
    }
  }
  
  while (activeDates.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return streak;
};

export const getStreakMilestones = (streak) => {
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  return milestones.filter(m => m <= streak);
};

// ============================================================================
// ACHIEVEMENTS & BADGES
// ============================================================================

export const ACHIEVEMENTS = {
  // First Steps
  FIRST_WORD: {
    id: 'first_word',
    name: 'First Word',
    description: 'Add your first word to the word bank',
    icon: '🌱',
    points: 25,
    category: 'beginner'
  },
  TEN_WORDS: {
    id: 'ten_words',
    name: 'Vocabulary Builder',
    description: 'Collect 10 words',
    icon: '📚',
    points: 50,
    category: 'word_bank'
  },
  FIFTY_WORDS: {
    id: 'fifty_words',
    name: 'Prolific Collector',
    description: 'Collect 50 words',
    icon: '📖',
    points: 100,
    category: 'word_bank'
  },
  HUNDRED_WORDS: {
    id: 'hundred_words',
    name: 'Word Master',
    description: 'Collect 100 words',
    icon: '🎓',
    points: 200,
    category: 'word_bank'
  },
  
  // Streaks
  THREE_DAY_STREAK: {
    id: 'three_day_streak',
    name: 'On Fire 🔥',
    description: 'Maintain a 3-day learning streak',
    icon: '🔥',
    points: 50,
    category: 'streak'
  },
  WEEK_STREAK: {
    id: 'week_streak',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '⚔️',
    points: 100,
    category: 'streak'
  },
  MONTH_STREAK: {
    id: 'month_streak',
    name: 'Unstoppable',
    description: 'Maintain a 30-day learning streak',
    icon: '💎',
    points: 250,
    category: 'streak'
  },
  CENTURY_STREAK: {
    id: 'century_streak',
    name: 'Legendary Learner',
    description: 'Maintain a 100-day learning streak',
    icon: '🏆',
    points: 500,
    category: 'streak'
  },
  
  // Study Sessions
  FIRST_MATCH: {
    id: 'first_match',
    name: 'Memory Initiate',
    description: 'Complete your first Match Pairs session',
    icon: '🧠',
    points: 25,
    category: 'study'
  },
  FIRST_QUIZ: {
    id: 'first_quiz',
    name: 'Quiz Starter',
    description: 'Complete your first Quiz session',
    icon: '❓',
    points: 25,
    category: 'study'
  },
  PERFECT_QUIZ: {
    id: 'perfect_quiz',
    name: 'Quiz Master',
    description: 'Score 100% on a quiz',
    icon: '💯',
    points: 75,
    category: 'study'
  },
  TEN_SESSIONS: {
    id: 'ten_sessions',
    name: 'Dedicated Learner',
    description: 'Complete 10 study sessions',
    icon: '📝',
    points: 100,
    category: 'study'
  },
  
  // Milestones
  LEVEL_TEN: {
    id: 'level_ten',
    name: 'Reaching New Heights',
    description: 'Reach Level 10',
    icon: '🚀',
    points: 150,
    category: 'level'
  },
  LEVEL_TWENTY: {
    id: 'level_twenty',
    name: 'Intermediate Master',
    description: 'Reach Level 20',
    icon: '⭐',
    points: 300,
    category: 'level'
  },
  THOUSAND_XP: {
    id: 'thousand_xp',
    name: 'XP Enthusiast',
    description: 'Earn 1,000 total XP',
    icon: '🎯',
    points: 100,
    category: 'xp'
  },
  FIVE_THOUSAND_XP: {
    id: 'five_thousand_xp',
    name: 'Extreme Grinder',
    description: 'Earn 5,000 total XP',
    icon: '⚡',
    points: 200,
    category: 'xp'
  },
};

export const checkAchievements = (stats) => {
  const earned = [];
  
  // Word bank achievements
  if (stats.wordCount === 1) earned.push(ACHIEVEMENTS.FIRST_WORD);
  if (stats.wordCount === 10) earned.push(ACHIEVEMENTS.TEN_WORDS);
  if (stats.wordCount === 50) earned.push(ACHIEVEMENTS.FIFTY_WORDS);
  if (stats.wordCount === 100) earned.push(ACHIEVEMENTS.HUNDRED_WORDS);
  
  // Streak achievements
  if (stats.streak === 3) earned.push(ACHIEVEMENTS.THREE_DAY_STREAK);
  if (stats.streak === 7) earned.push(ACHIEVEMENTS.WEEK_STREAK);
  if (stats.streak === 30) earned.push(ACHIEVEMENTS.MONTH_STREAK);
  if (stats.streak === 100) earned.push(ACHIEVEMENTS.CENTURY_STREAK);
  
  // Level achievements
  if (stats.level === 10) earned.push(ACHIEVEMENTS.LEVEL_TEN);
  if (stats.level === 20) earned.push(ACHIEVEMENTS.LEVEL_TWENTY);
  
  // XP achievements
  if (stats.totalXP >= 1000 && stats.totalXP < 5000) earned.push(ACHIEVEMENTS.THOUSAND_XP);
  if (stats.totalXP >= 5000) earned.push(ACHIEVEMENTS.FIVE_THOUSAND_XP);
  
  return earned;
};

// ============================================================================
// MASTERY SYSTEM - Track word proficiency
// ============================================================================

export const MASTERY_LEVELS = [
  { level: 0, name: 'New', color: '#64748b', threshold: 0 },
  { level: 1, name: 'Learning', color: '#3b82f6', threshold: 1 },
  { level: 2, name: 'Familiar', color: '#8b5cf6', threshold: 5 },
  { level: 3, name: 'Comfortable', color: '#06b6d4', threshold: 15 },
  { level: 4, name: 'Fluent', color: '#10b981', threshold: 30 },
  { level: 5, name: 'Mastered', color: '#f59e0b', threshold: 50 },
];

export const calculateMastery = (word) => {
  const reviewCount = word.reviewCount || word.reviews?.length || 0;
  const correctness = word.correctness || 0; // Out of 100
  
  // Combine review count and correctness
  const masteryScore = (reviewCount * 2) + (correctness * 0.5);
  
  // Find mastery level
  let masteryLevel = 0;
  for (let m of [...MASTERY_LEVELS].reverse()) {
    if (masteryScore >= m.threshold) {
      masteryLevel = m.level;
      break;
    }
  }
  
  return {
    score: masteryScore,
    level: masteryLevel,
    levelName: MASTERY_LEVELS[masteryLevel].name,
  };
};

// ============================================================================
// DAILY CHALLENGES - Special daily tasks
// ============================================================================

export const generateDailyChallenges = (userProfile) => {
  const challenges = [];
  const today = new Date().toDateString();
  
  // Challenge pool based on user level
  const baseCount = Math.min(3, Math.floor(userProfile.level / 10) + 3);
  
  const possibleChallenges = [
    {
      id: 'daily_word',
      name: '📚 Add a Word',
      description: 'Add 1 new word to your word bank',
      xpReward: 25,
      requirement: 1
    },
    {
      id: 'study_session',
      name: '🧠 Study Session',
      description: 'Complete 1 study session (Quiz or Match)',
      xpReward: 50,
      requirement: 1
    },
    {
      id: 'quiz_perfect',
      name: '💯 Perfect Quiz',
      description: 'Score 100% on a quiz',
      xpReward: 75,
      requirement: 1,
      difficulty: 'hard'
    },
    {
      id: 'five_words',
      name: '✨ Vocabulary Sprint',
      description: 'Add 5 words in one day',
      xpReward: 100,
      requirement: 5
    },
    {
      id: 'match_streak',
      name: '🔥 Match Mastery',
      description: 'Complete 3 Match Pairs sessions',
      xpReward: 100,
      requirement: 3
    },
  ];
  
  // Shuffle and select random challenges
  const shuffled = possibleChallenges.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, baseCount).map(c => ({
    ...c,
    date: today,
    completed: false,
    progress: 0,
  }));
};

// ============================================================================
// COMPREHENSIVE STATS CALCULATION
// ============================================================================

export const calculateComprehensiveStats = (words = [], studySessions = [], userProfile = {}) => {
  const totalXP = words.reduce((sum, w) => sum + (w.earnedXP || 10), 0);
  const levelInfo = getLevelFromXP(totalXP);
  const streak = calculateConsecutiveDays(words);
  
  // Study stats
  const sessionsCount = studySessions.length;
  const perfectSessions = studySessions.filter(s => s.perfectScore).length;
  
  // Calculate mastery
  const masteries = words.map(w => calculateMastery(w));
  const avgMastery = words.length > 0 
    ? masteries.reduce((sum, m) => sum + m.level, 0) / words.length 
    : 0;
  
  const stats = {
    // Core stats
    level: levelInfo.level,
    title: levelInfo.title,
    tierColor: levelInfo.tierColor,
    totalXP: levelInfo.totalXP,
    currentLevelXP: levelInfo.currentLevelXP,
    xpForNextLevel: levelInfo.xpForNextLevel,
    progressPercent: levelInfo.progressPercent,
    
    // Streaks
    streak,
    streakMilestones: getStreakMilestones(streak),
    
    // Content stats
    wordCount: words.length,
    studySessionCount: sessionsCount,
    perfectSessionCount: perfectSessions,
    avgMastery: Math.round(avgMastery * 100) / 100,
    
    // Achievements
    achievements: checkAchievements({
      wordCount: words.length,
      streak,
      level: levelInfo.level,
      totalXP: levelInfo.totalXP,
    }),
  };
  
  return stats;
};

export default {
  calculateActivityXP,
  getLevelFromXP,
  xpRequiredForLevel,
  calculateConsecutiveDays,
  getStreakMilestones,
  checkAchievements,
  calculateMastery,
  generateDailyChallenges,
  calculateComprehensiveStats,
};
