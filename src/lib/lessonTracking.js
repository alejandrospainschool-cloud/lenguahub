// src/lib/lessonTracking.js
// Utilities for lesson tracking and monthly reset logic

/**
 * Get the current month-year key for lesson tracking
 * @returns {string} Format: "2026-02"
 */
export function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get lessons for current month
 * @param {Array} allLessons - All lesson documents
 * @returns {Array} Lessons from current month
 */
export function getLessonsThisMonth(allLessons = []) {
  if (!Array.isArray(allLessons)) return []
  const now = new Date()
  return allLessons.filter(lesson => {
    if (!lesson.date) return false
    const lessonDate = new Date(lesson.date)
    return (
      lessonDate.getMonth() === now.getMonth() &&
      lessonDate.getFullYear() === now.getFullYear()
    )
  })
}

/**
 * Get lessons logged this month (have status, not just created)
 * @param {Array} allLessons - All lesson documents
 * @returns {Array} Lessons with "logged" or "approved" status from current month
 */
export function getLoggedLessonsThisMonth(allLessons = []) {
  return getLessonsThisMonth(allLessons).filter(
    lesson => lesson.status === 'logged' || lesson.status === 'approved'
  )
}

/**
 * Calculate remaining lessons needed (up to 8 per month)
 * @param {number} loggedCount - Number of lessons logged this month
 * @returns {number} Lessons remaining (0-8)
 */
export function getLessonsRemaining(loggedCount = 0) {
  const LESSONS_PER_MONTH = 8
  return Math.max(0, LESSONS_PER_MONTH - loggedCount)
}

/**
 * Check if payment is due (all 8 lessons completed)
 * @param {number} loggedCount - Lessons logged this month
 * @returns {boolean} True if 8 lessons reached
 */
export function isPaymentDue(loggedCount = 0) {
  return loggedCount >= 8
}

/**
 * Get estimated date for next payment based on lesson pace
 * @param {Array} lessons - All lessons from past months
 * @returns {Date|null} Estimated payment due date or null
 */
export function getEstimatedPaymentDate(lessons = []) {
  if (!Array.isArray(lessons) || lessons.length < 8) return null
  
  const last30Days = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return lessonDate >= thirtyDaysAgo
  })
  
  if (last30Days.length === 0) return null
  
  // Calculate average lessons per day and project forward
  const avgPerDay = last30Days.length / 30
  if (avgPerDay === 0) return null
  
  const daysToNext8 = 8 / avgPerDay
  const estimatedDate = new Date()
  estimatedDate.setDate(estimatedDate.getDate() + daysToNext8)
  
  return estimatedDate
}

/**
 * Calculate stats for lessons
 * @param {Array} lessons - All lessons
 * @returns {Object} Stats object
 */
export function calculateLessonStats(lessons = []) {
  if (!Array.isArray(lessons)) {
    return {
      total: 0,
      thisMonth: 0,
      remaining: 8,
      isPaid: false,
      totalHours: 0,
      lastLessonDate: null,
    }
  }

  const thisMonthLessons = getLoggedLessonsThisMonth(lessons)
  const loggedCount = thisMonthLessons.length
  
  // Total hours (assume 1 hour per lesson if not specified)
  const totalHours = lessons.reduce((sum, l) => sum + (l.duration || 60) / 60, 0)
  
  // Last lesson date
  const sortedByDate = [...lessons].sort((a, b) => new Date(b.date) - new Date(a.date))
  const lastLessonDate = sortedByDate[0]?.date || null

  return {
    total: lessons.length,
    thisMonth: loggedCount,
    remaining: getLessonsRemaining(loggedCount),
    isPaid: isPaymentDue(loggedCount),
    totalHours: Math.round(totalHours * 10) / 10,
    lastLessonDate,
  }
}

/**
 * Lesson types/categories
 */
export const LESSON_TYPES = [
  { id: 'conversation', label: 'Conversation', icon: '💬' },
  { id: 'grammar', label: 'Grammar', icon: '📚' },
  { id: 'reading', label: 'Reading', icon: '📖' },
  { id: 'writing', label: 'Writing', icon: '✍️' },
  { id: 'listening', label: 'Listening', icon: '👂' },
  { id: 'mixed', label: 'Mixed', icon: '🎯' },
]

export function getLessonTypeLabel(typeId) {
  return LESSON_TYPES.find(t => t.id === typeId)?.label || 'Lesson'
}

export function getLessonTypeIcon(typeId) {
  return LESSON_TYPES.find(t => t.id === typeId)?.icon || '📝'
}
