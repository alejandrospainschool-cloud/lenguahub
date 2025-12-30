// src/lib/freemium.js

export const FREEMIUM_LIMITS = {
  WORDS_PER_DAY: 5,
  QUIZZES_PER_DAY: 1,
  MATCHES_PER_DAY: 1,
  FLASHCARDS_PER_DAY: 10,
}

// Helper to check if a specific limit is reached
export const hasReachedLimit = (userUsage, limitKey, isPremium) => {
  if (isPremium) return false // Premium users have no limits
  
  const limit = FREEMIUM_LIMITS[limitKey]
  const current = userUsage?.[limitKey] || 0
  
  return current >= limit
}

// Helper to get reset object for a new day
export const getEmptyUsage = () => ({
  date: new Date().toDateString(),
  wordsAdded: 0,
  quizzesPlayed: 0,
  matchesPlayed: 0,
  flashcardsViewed: 0,
})