// src/lib/freemium.js

export const FREEMIUM_LIMITS = {
  wordsAdded: 5,
  quizzesPlayed: 1,
  matchesPlayed: 1,
  flashcardsViewed: 10,
  aiRequests: 3, // NEW: Limit for AI Tools
}

export const getEmptyUsage = () => ({
  date: new Date().toDateString(),
  wordsAdded: 0,
  quizzesPlayed: 0,
  matchesPlayed: 0,
  flashcardsViewed: 0,
  aiRequests: 0, // NEW
})

export const hasReachedLimit = (userUsage, limitKey, isPremium) => {
  if (isPremium) return false 
  
  const limit = FREEMIUM_LIMITS[limitKey]
  const current = userUsage?.[limitKey] || 0
  
  // Safety check
  if (limit === undefined) {
    console.error(`Limit key "${limitKey}" not found in FREEMIUM_LIMITS`)
    return true 
  }
  
  return current >= limit
}