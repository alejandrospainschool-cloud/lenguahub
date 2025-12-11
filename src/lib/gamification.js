// src/lib/gamification.js

export const calculateStats = (words = []) => {
  // 1. Calculate XP
  // Rule: 10 XP per word
  const xpPerWord = 10;
  const totalXP = words.length * xpPerWord;

  // 2. Calculate Level
  // Rule: Level up every 100 XP
  const currentLevel = Math.floor(totalXP / 100) + 1;
  const xpForNextLevel = 100;
  const currentLevelXP = totalXP % 100; // How much XP in the current level (0-99)

  // 3. Calculate Streak
  let streak = 0;
  
  if (words.length > 0) {
    // Sort words by date (newest first) just to be safe
    const sortedWords = [...words].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    // Check the most recent word
    const lastWordDate = sortedWords[0].createdAt?.toDate();
    
    if (lastWordDate) {
      const lastDateNormalized = new Date(lastWordDate);
      lastDateNormalized.setHours(0, 0, 0, 0);

      const oneDay = 1000 * 60 * 60 * 24;
      const diffInTime = today.getTime() - lastDateNormalized.getTime();
      const diffInDays = Math.round(diffInTime / oneDay);

      // If last word was added today or yesterday, the streak is alive
      if (diffInDays <= 1) {
        // Calculate the consecutive days
        // This is a simplified streak (just checks total count for now or recent activity)
        // For a true "consecutive days" calculation, we'd need to loop through history.
        // Let's use a "Active Days" count for now as a robust start.
        streak = calculateConsecutiveDays(sortedWords);
      } else {
        streak = 0; // Streak broken!
      }
    }
  }

  return {
    level: currentLevel,
    totalXP,
    currentLevelXP,
    xpForNextLevel,
    streak
  };
};

// Helper: Count how many days in a row they added words
function calculateConsecutiveDays(sortedWords) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today); // Start checking from today

  // Get all unique dates where words were added
  const activeDates = new Set(
    sortedWords.map(w => {
      if(!w.createdAt) return null;
      const d = w.createdAt.toDate();
      return d.toDateString();
    }).filter(d => d)
  );

  // If they haven't added anything today, check if they added something yesterday to keep streak
  if (!activeDates.has(today.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1); // Move check to yesterday
    if (!activeDates.has(checkDate.toDateString())) {
      return 0; // Missed yesterday too? Streak is 0.
    }
  }

  // Count backwards
  while (activeDates.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1); // Go back one day
  }

  return streak;
}