/**
 * SIMPLE GAMIFICATION SYSTEM - Badge & Level System
 * Clean, focused, not cluttering the dashboard
 */

// ============================================================================
// BADGE TIERS - 8 Progression Tiers
// ============================================================================

export const BADGE_TIERS = [
  {
    tier: 1,
    name: 'Wood',
    color: '#92400e',
    emoji: '🪵',
    goals: {
      words: 10,
      quizzes: 5,
      matches: 5,
      flashcards: 5,
      sentences: 5,
    }
  },
  {
    tier: 2,
    name: 'Iron',
    color: '#4b5563',
    emoji: '⚙️',
    goals: {
      words: 50,
      quizzes: 25,
      matches: 25,
      flashcards: 25,
      sentences: 25,
    }
  },
  {
    tier: 3,
    name: 'Bronze',
    color: '#b87333',
    emoji: '🥉',
    goals: {
      words: 100,
      quizzes: 50,
      matches: 50,
      flashcards: 50,
      sentences: 50,
    }
  },
  {
    tier: 4,
    name: 'Silver',
    color: '#c0c0c0',
    emoji: '🥈',
    goals: {
      words: 250,
      quizzes: 100,
      matches: 100,
      flashcards: 100,
      sentences: 100,
    }
  },
  {
    tier: 5,
    name: 'Gold',
    color: '#ffd700',
    emoji: '🥇',
    goals: {
      words: 500,
      quizzes: 250,
      matches: 250,
      flashcards: 250,
      sentences: 250,
    }
  },
  {
    tier: 6,
    name: 'Platinum',
    color: '#e5e4e2',
    emoji: '💎',
    goals: {
      words: 1000,
      quizzes: 350,
      matches: 350,
      flashcards: 350,
      sentences: 350,
    }
  },
  {
    tier: 7,
    name: 'Diamond',
    color: '#b9f2ff',
    emoji: '✨',
    goals: {
      words: 2500,
      quizzes: 400,
      matches: 400,
      flashcards: 400,
      sentences: 400,
    }
  },
  {
    tier: 8,
    name: 'Ruby',
    color: '#e0115f',
    emoji: '💎',
    goals: {
      words: 5000,
      quizzes: 500,
      matches: 500,
      flashcards: 500,
      sentences: 500,
    }
  },
];

// ============================================================================
// CURRENT BADGE CALCULATION
// ============================================================================

export const calculateCurrentBadge = (stats) => {
  // Find the highest tier the user has unlocked
  let currentTier = 0;
  
  for (const tier of BADGE_TIERS) {
    const meetsAllGoals = 
      stats.words >= tier.goals.words &&
      stats.quizzes >= tier.goals.quizzes &&
      stats.matches >= tier.goals.matches &&
      stats.flashcards >= tier.goals.flashcards &&
      stats.sentences >= tier.goals.sentences;
    
    if (meetsAllGoals) {
      currentTier = tier.tier;
    }
  }
  
  return BADGE_TIERS[currentTier] || BADGE_TIERS[0];
};

// ============================================================================
// NEXT BADGE PROGRESS
// ============================================================================

export const getNextBadgeProgress = (stats) => {
  const currentBadge = calculateCurrentBadge(stats);
  
  // If already at Ruby (tier 8), no next badge
  if (currentBadge.tier === 8) {
    return {
      nextBadge: null,
      progress: {
        words: { current: stats.words, goal: currentBadge.goals.words },
        quizzes: { current: stats.quizzes, goal: currentBadge.goals.quizzes },
        matches: { current: stats.matches, goal: currentBadge.goals.matches },
        flashcards: { current: stats.flashcards, goal: currentBadge.goals.flashcards },
        sentences: { current: stats.sentences, goal: currentBadge.goals.sentences },
      }
    };
  }
  
  // Get next tier
  const nextTier = BADGE_TIERS[currentBadge.tier];
  
  return {
    nextBadge: nextTier,
    progress: {
      words: { current: stats.words, goal: nextTier.goals.words },
      quizzes: { current: stats.quizzes, goal: nextTier.goals.quizzes },
      matches: { current: stats.matches, goal: nextTier.goals.matches },
      flashcards: { current: stats.flashcards, goal: nextTier.goals.flashcards },
      sentences: { current: stats.sentences, goal: nextTier.goals.sentences },
    }
  };
};

// ============================================================================
// SIMPLE LEVEL SYSTEM
// ============================================================================

export const xpRequiredForLevel = (level) => {
  // Simple: 100 * level^1.5
  return Math.ceil(100 * Math.pow(level, 1.5));
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
  
  return {
    level,
    currentLevelXP,
    xpForNextLevel,
    totalXP,
    progressPercent,
  };
};

// ============================================================================
// CALCULATE STATS FROM ACTIVITIES
// ============================================================================

export const calculateGameStats = (activities) => {
  if (!activities) return {
    words: 0,
    quizzes: 0,
    matches: 0,
    flashcards: 0,
    sentences: 0,
    totalXP: 0,
  };

  const stats = {
    words: activities.wordCount || 0,
    quizzes: activities.quizzes || 0,
    matches: activities.matches || 0,
    flashcards: activities.flashcards || 0,
    sentences: activities.sentences || 0,
    totalXP: activities.totalXP || 0,
  };

  return stats;
};

export default {
  BADGE_TIERS,
  calculateCurrentBadge,
  getNextBadgeProgress,
  xpRequiredForLevel,
  getLevelFromXP,
  calculateGameStats,
};
