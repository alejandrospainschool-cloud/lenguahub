// src/lib/gamification.js

/**
 * Gamification System - Overhauled
 * 
 * XP System:
 * - Base XP for adding words (varied by difficulty)
 * - Bonus XP for streak milestones
 * - Bonus XP for consistent daily learning
 * 
 * Level System:
 * - Exponential scaling: each level requires more XP than the last
 * - Formula: XP needed = 100 * level^1.5
 * - Levels start at 1, increase infinitely
 */

// Calculate XP for a single word (dynamic based on properties)
function calculateWordXP(word) {
  let xp = 20; // Base XP per word
  
  // Bonus for word properties
  if (word.difficulty) {
    if (word.difficulty === 'hard') xp += 15;
    if (word.difficulty === 'medium') xp += 8;
    if (word.difficulty === 'easy') xp += 2;
  }
  
  // Bonus if the word has translations/definitions
  if (word.translation) xp += 5;
  if (word.definition) xp += 5;
  if (word.example) xp += 3;
  
  return xp;
}

// Calculate total XP from all words
function calculateTotalXP(words = []) {
  if (!words.length) return 0;
  
  let totalXP = 0;
  
  words.forEach(word => {
    totalXP += calculateWordXP(word);
  });
  
  // Streak bonus: 5% bonus per 5-day streak
  const streak = calculateConsecutiveDays(words);
  if (streak >= 5) {
    const streakBonus = Math.floor((streak / 5) * totalXP * 0.05);
    totalXP += streakBonus;
  }
  
  return totalXP;
}

// Calculate XP required for a specific level
function xpRequiredForLevel(level) {
  // Exponential scaling: each level gets progressively harder
  // Level 1: 100, Level 2: 189, Level 3: 323, Level 4: 510, Level 5: 750...
  return Math.ceil(100 * Math.pow(level, 1.5));
}

// Calculate current level and progress from total XP
function getLevelFromXP(totalXP) {
  let level = 1;
  let accumulatedXP = 0;
  
  // Find current level
  while (accumulatedXP + xpRequiredForLevel(level) <= totalXP) {
    accumulatedXP += xpRequiredForLevel(level);
    level++;
  }
  
  // Calculate XP in current level and XP needed for next
  const currentLevelXP = totalXP - accumulatedXP;
  const xpForNextLevel = xpRequiredForLevel(level);
  
  return {
    level,
    currentLevelXP,
    xpForNextLevel,
    accumulatedXP
  };
}

export const calculateStats = (words = []) => {
  const totalXP = calculateTotalXP(words);
  const levelInfo = getLevelFromXP(totalXP);
  
  // Calculate streak
  let streak = 0;
  if (words.length > 0) {
    const sortedWords = [...words].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWordDate = sortedWords[0].createdAt?.toDate();
    
    if (lastWordDate) {
      const lastDateNormalized = new Date(lastWordDate);
      lastDateNormalized.setHours(0, 0, 0, 0);
      
      const oneDay = 1000 * 60 * 60 * 24;
      const diffInTime = today.getTime() - lastDateNormalized.getTime();
      const diffInDays = Math.round(diffInTime / oneDay);
      
      if (diffInDays <= 1) {
        streak = calculateConsecutiveDays(sortedWords);
      } else {
        streak = 0;
      }
    }
  }
  
  return {
    level: levelInfo.level,
    totalXP,
    currentLevelXP: levelInfo.currentLevelXP,
    xpForNextLevel: levelInfo.xpForNextLevel,
    streak,
    progressPercent: Math.round((levelInfo.currentLevelXP / levelInfo.xpForNextLevel) * 100)
  };
};

// Helper: Count consecutive days with word additions
function calculateConsecutiveDays(sortedWords) {
  if (!sortedWords.length) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today);
  
  const activeDates = new Set(
    sortedWords.map(w => {
      if (!w.createdAt) return null;
      const d = w.createdAt.toDate();
      return d.toDateString();
    }).filter(d => d)
  );
  
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
}