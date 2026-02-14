// src/lib/linguaRobot.js
// Utility for fetching word info via the backend API endpoint
// The backend handles calling Lingua Robot API and provides database fallback data

/**
 * Fetches word info from the backend endpoint (which calls Lingua Robot API)
 * @param {string} word - The word to look up
 * @returns {Promise<Object>} - Word info with enriched data or fallback data
 */
export async function fetchWordInfo(word) {
  if (!word) throw new Error('No word provided');

  console.log('[linguaRobot] Fetching word info for:', word);

  try {
    // Call backend endpoint instead of API directly (avoids CORS issues)
    const res = await fetch(`/api/wordinfo?word=${encodeURIComponent(word)}`);

    console.log('[linguaRobot] Response status:', res.status, res.statusText);

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log('[linguaRobot] Success! Data:', data);

    // Validate response has entries
    if (!data.entries || !Array.isArray(data.entries)) {
      console.warn('[linguaRobot] No entries array in response');
      throw new Error('No entries in response');
    }

    if (data.entries.length === 0) {
      console.warn('[linguaRobot] Entries array is empty');
      throw new Error('No entries found');
    }

    // Log if data came from database
    if (data.success === true) {
      console.log('[linguaRobot] ✓ Data from Spanish word database');
    } else if (data.success === false) {
      console.log('[linguaRobot] ⚠ Data not found in database or API');
    }

    return data;
  } catch (error) {
    console.error('[linguaRobot] Fetch error:', error.message);
    throw error;
  }
}
