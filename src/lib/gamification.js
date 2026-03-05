/**
 * GAMIFICATION SYSTEM - Simple Badge & Level System
 * 
 * Features:
 * - 8 Badge Tiers (Wood → Iron → Bronze → Silver → Gold → Platinum → Diamond → Emerald → Ruby)
 * - Tracks: Words, Quizzes, Matches, Flashcards, Sentence Practices
 * - Simple exponential leveling
 * - Clean, non-intrusive progress tracking
 */

// ============================================================================
// BADGE TIER SYSTEM
// ============================================================================

export const BADGE_TIERS = [
  {
    tier: 0,
    name: 'Wood',
    color: '#8B7355',
    icon: '🪵',
    requirements: {
      words: 10,
      quizzes: 5,
      matches: 5,
      flashcards: 5,
      sentencePractices: 1,
    }
  },
  {
    tier: 1,
    name: 'Iron',
    color: '#A0A0A0',
    icon: '⚙️',
    requirements: {
      words: 50,
      quizzes: 25,
      matches: 25,
      flashcards: 25,
      sentencePractices: 10,
    }
  },
  {
    tier: 2,
    name: 'Bronze',
    color: '#CD7F32',
    icon: '🔔',
    requirements: {
      words: 100,
      quizzes: 50,
      matches: 50,
      flashcards: 50,
      sentencePractices: 25,
    }
  },
  {
    tier: 3,
    name: 'Silver',
    color: '#C0C0C0',
    icon: '🥈',
    requirements: {
      words: 250,
      quizzes: 100,
      matches: 100,
      flashcards: 100,
      sentencePractices: 50,
    }
  },
  {
    tier: 4,
    name: 'Gold',
    color: '#FFD700',
    icon: '🥇',
    requirements: {
      words: 500,
      quizzes: 200,
      matches: 200,
      flashcards: 200,
      sentencePractices: 100,
    }
  },
  {
    tier: 5,
    name: 'Platinum',
    color: '#E5E4E2',
    icon: '💎',
    requirements: {
      words: 1000,
      quizzes: 350,
      matches: 350,
      flashcards: 350,
      sentencePractices: 200,
    }
  },
  {
    tier: 6,
    name: 'Diamond',
    color: '#B9F2FF',
    icon: '💠',
    requirements: {
      words: 2500,
      quizzes: 400,
      matches: 400,
      flashcards: 400,
      sentencePractices: 300,
    }
  },
  {
    tier: 7,
    name: 'Emerald',
    color: '#50C878',
    icon: '💚',
    requirements: {
      words: 4000,
      quizzes: 450,
      matches: 450,
      flashcards: 450,
      sentencePractices: 400,
    }
  },
  {
    tier: 8,
    name: 'Ruby',
    color: '#E0115F',
    icon: '❤️',
    requirements: {
      words: 5000,
      quizzes: 500,
      matches: 500,
      flashcards: 500,
      sentencePractices: 500,
    }
  }
];

/**
 * Get the current badge tier based on stats
 * Returns the highest tier the user has achieved
 */
export const getCurrentBadgeTier = (stats) => {
  if (!stats) return BADGE_TIERS[0];
  
  // Find highest tier where ALL requirements are met
  for (let i = BADGE_TIERS.length - 1; i >= 0; i--) {
    const tier = BADGE_TIERS[i];
    const meetsAll = 
      (stats.wordCount || 0) >= tier.requirements.words &&
      (stats.quizzesCompleted || 0) >= tier.requirements.quizzes &&
      (stats.matchesCompleted || 0) >= tier.requirements.matches &&
      (stats.flashcardsCompleted || 0) >= tier.requirements.flashcards &&
      (stats.sentencePracticesCompleted || 0) >= tier.requirements.sentencePractices;
    
    if (meetsAll) return tier;
  }
  
  return BADGE_TIERS[0];
};

/**
 * Get progress towards next tier
 * Returns { tier, progress: 0-100 }
 */
export const getProgressToNextTier = (stats) => {
  const currentTier = getCurrentBadgeTier(stats);
  
  if (currentTier.tier === BADGE_TIERS.length - 1) {
    return { tier: currentTier, progress: 100, message: 'Ultimate tier reached!' };
  }
  
  const nextTier = BADGE_TIERS[currentTier.tier + 1];
  
  // Calculate progress as average across all requirements
  const progressValues = [
    (stats.wordCount || 0) / nextTier.requirements.words,
    (stats.quizzesCompleted || 0) / nextTier.requirements.quizzes,
    (stats.matchesCompleted || 0) / nextTier.requirements.matches,
    (stats.flashcardsCompleted || 0) / nextTier.requirements.flashcards,
    (stats.sentencePracticesCompleted || 0) / nextTier.requirements.sentencePractices,
  ];
  
  const avgProgress = progressValues.reduce((a, b) => a + b, 0) / progressValues.length;
  const progress = Math.round(Math.min(avgProgress * 100, 99)); // Cap at 99 before unlocking
  
  return { tier: nextTier, progress };
};

// ============================================================================
// SIMPLE LEVELING SYSTEM
// ============================================================================

/**
 * Calculate level based on total words (simple exponential)
 * Formula: level = floor(sqrt(words / 10)) + 1
 * This gives a natural progression without being too complicated
 */
export const calculateLevel = (wordCount = 0) => {
  if (wordCount === 0) return 1;
  return Math.floor(Math.sqrt(wordCount / 10)) + 1;
};

/**
 * Get words needed for next level
 */
export const getWordsForNextLevel = (currentLevel) => {
  const nextLevel = currentLevel + 1;
  return Math.ceil(((nextLevel - 1) ** 2) * 10);
};

/**
 * Get all stats for dashboard display
 */
export const calculateStats = (words = [], studySessions = {}) => {
  const stats = {
    wordCount: words.length,
    quizzesCompleted: studySessions.quizzes || 0,
    matchesCompleted: studySessions.matches || 0,
    flashcardsCompleted: studySessions.flashcards || 0,
    sentencePracticesCompleted: studySessions.sentences || 0,
  };
  
  const level = calculateLevel(stats.wordCount);
  const currentTierWords = Math.ceil(((level - 1) ** 2) * 10);
  const nextTierWords = getWordsForNextLevel(level);
  const progressToNextLevel = Math.round(((stats.wordCount - currentTierWords) / (nextTierWords - currentTierWords)) * 100);
  
  return {
    ...stats,
    level,
    progressToNextLevel: Math.max(0, Math.min(progressToNextLevel, 100)),
    currentTierWords,
    nextTierWords,
    badge: getCurrentBadgeTier(stats),
    nextBadgeProgress: getProgressToNextTier(stats),
  };
};

export default {
  BADGE_TIERS,
  getCurrentBadgeTier,
  getProgressToNextTier,
  calculateLevel,
  getWordsForNextLevel,
  calculateStats,
};