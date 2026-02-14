// src/lib/linguaRobot.js
// Client for fetching word information via the backend API endpoint
// The backend uses Gemini AI to provide comprehensive Spanish word data

/**
 * Fetches comprehensive word information from the backend
 * @param {string} word - The Spanish word to look up
 * @returns {Promise<Object>} - Word info with definitions, conjugations, examples
 */
export async function fetchWordInfo(word) {
  if (!word || !word.trim()) throw new Error('No word provided');

  const cleanWord = word.trim().toLowerCase();

  const res = await fetch(`/api/wordinfo?word=${encodeURIComponent(cleanWord)}`);

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}
