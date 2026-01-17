// src/lib/animationHelpers.js

/**
 * Utility functions for managing animations throughout the app
 */

// Check if user has seen daily welcome today
export const hasSeenDailyWelcomeToday = (user) => {
  if (!user?.uid) return false
  
  const key = `daily_welcome_${user.uid}`
  const stored = localStorage.getItem(key)
  
  if (!stored) return false
  
  const storedDate = new Date(stored)
  const today = new Date()
  
  return storedDate.toDateString() === today.toDateString()
}

// Mark daily welcome as seen
export const markDailyWelcomeAsSeen = (user) => {
  if (!user?.uid) return
  
  const key = `daily_welcome_${user.uid}`
  localStorage.setItem(key, new Date().toISOString())
}

// Check if user leveled up
export const checkLevelUp = (previousStats, currentStats) => {
  return currentStats.level > previousStats.level
}

// Get the previous stats from localStorage for comparison
export const getPreviousStats = (user) => {
  if (!user?.uid) return null
  
  const key = `user_stats_${user.uid}`
  const stored = localStorage.getItem(key)
  
  return stored ? JSON.parse(stored) : null
}

// Save current stats for next comparison
export const saveCurrentStats = (user, stats) => {
  if (!user?.uid) return
  
  const key = `user_stats_${user.uid}`
  localStorage.setItem(key, JSON.stringify(stats))
}

// Check if streak milestone reached (multiple of 5)
export const isStreakMilestone = (streak) => {
  return streak > 0 && streak % 5 === 0
}

// Get streak milestone message
export const getStreakMessage = (streak) => {
  if (streak === 1) return "🎉 You started your streak!"
  if (streak === 5) return "🔥 5 days strong!"
  if (streak === 10) return "⚡ 10 day streak!"
  if (streak === 30) return "🚀 One month of consistency!"
  if (streak === 100) return "💯 100 days unstoppable!"
  return `${streak} days of pure dedication!`
}

// Disable scroll during animations (for modals)
export const disableScroll = () => {
  document.body.style.overflow = 'hidden'
}

export const enableScroll = () => {
  document.body.style.overflow = 'unset'
}

// Create a pulse effect on an element
export const createPulseEffect = (element) => {
  if (!element) return
  
  element.classList.add('animate-pulse')
  setTimeout(() => {
    element.classList.remove('animate-pulse')
  }, 2000)
}

// Trigger a glow effect
export const createGlowEffect = (element) => {
  if (!element) return
  
  element.classList.add('animate-glow')
  setTimeout(() => {
    element.classList.remove('animate-glow')
  }, 3000)
}

// Random celebration messages
export const getCelebrationMessages = () => {
  const messages = [
    "¡Excelente! Keep it up!",
    "You're on fire! 🔥",
    "Amazing progress! 🌟",
    "Keep crushing it! 💪",
    "You got this! 🎯",
    "Incredible work! ⭐",
    "Level master! 👑",
    "On top of the world! 🌍",
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

export default {
  hasSeenDailyWelcomeToday,
  markDailyWelcomeAsSeen,
  checkLevelUp,
  getPreviousStats,
  saveCurrentStats,
  isStreakMilestone,
  getStreakMessage,
  disableScroll,
  enableScroll,
  createPulseEffect,
  createGlowEffect,
  getCelebrationMessages,
}
