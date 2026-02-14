// src/lib/linguaRobot.js
// Utility for fetching word info from Lingua Robot API

// NOTE: For production, store this key securely (e.g., in environment variables or a serverless function)
const API_KEY = 'b0cb62497emshb7e9ff7dd84d939p1acf82jsnac2aa7ce67ad';
const BASE_URL = 'https://lingua-robot.p.rapidapi.com/language/v1/entries/es';

/**
 * Fetches word info from Lingua Robot API (Spanish)
 * @param {string} word - The word to look up
 * @returns {Promise<Object>} - API response JSON
 */
export async function fetchWordInfo(word) {
  if (!word) throw new Error('No word provided');
  const url = `${BASE_URL}/${encodeURIComponent(word)}`;
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'lingua-robot.p.rapidapi.com',
    },
  });
  if (!res.ok) {
    let msg = 'Failed to fetch word info';
    try {
      const err = await res.json();
      if (err && err.message) msg = err.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
