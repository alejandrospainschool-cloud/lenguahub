// src/lib/freemium.js

export const FREEMIUM_LIMITS = {
  // These names MUST match the keys in dailyUsage
  wordsAdded: 5,
  quizzesPlayed: 1,
  matchesPlayed: 1,
  flashcardsViewed: 10,
}

export const getEmptyUsage = () => ({
  date: new Date().toDateString(),
  wordsAdded: 0,
  quizzesPlayed: 0,
  matchesPlayed: 0,
  flashcardsViewed: 0,
})

export const hasReachedLimit = (userUsage, limitKey, isPremium) => {
  if (isPremium) return false // Premium users have no limits
  
  const limit = FREEMIUM_LIMITS[limitKey]
  const current = userUsage?.[limitKey] || 0
  
  // Safety check: if we can't find the limit, default to blocking to prevent abuse
  if (limit === undefined) {
    console.error(`Limit key "${limitKey}" not found in FREEMIUM_LIMITS`)
    return true 
  }
  
  return current >= limit
}