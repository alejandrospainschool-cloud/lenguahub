// api/wordinfo.js
// Server-side endpoint for fetching word information from Lingua Robot API
// This avoids CORS issues and keeps the API key secure

const API_KEY = process.env.LINGUA_ROBOT_API_KEY || 'b0cb62497emshb7e9ff7dd84d939p1acf82jsnac2aa7ce67ad';
const BASE_URL = 'https://lingua-robot.p.rapidapi.com/language/v1/entries/es';

/**
 * Creates fallback enriched data when API fails
 */
function createFallbackData(word) {
  const lowerWord = word.toLowerCase();

  // Common Spanish verb patterns for demonstration
  const commonVerbs = {
    hablar: {
      infinitive: 'hablar',
      type: 'ar-verb',
      meaning: 'to speak',
      present: ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'],
    },
    tener: {
      infinitive: 'tener',
      type: 'ir-verb',
      meaning: 'to have',
      present: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'],
    },
    ser: {
      infinitive: 'ser',
      type: 'ir-verb',
      meaning: 'to be',
      present: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
    },
    estar: {
      infinitive: 'estar',
      type: 'ar-verb',
      meaning: 'to be (location)',
      present: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
    },
    ir: {
      infinitive: 'ir',
      type: 'ir-verb',
      meaning: 'to go',
      present: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
    },
  };

  const verbInfo = commonVerbs[lowerWord];

  return {
    word,
    success: false,
    fallback: true,
    entries: [
      {
        word,
        partOfSpeech: verbInfo ? 'verb' : 'noun',
        definitions: verbInfo ? [{ text: verbInfo.meaning }] : [{ text: `Definition for '${word}' (API unavailable)` }],
        inflections: verbInfo ? [] : [],
        conjugations: verbInfo
          ? {
              present: verbInfo.present.join(', '),
              note: 'Limited conjugations - API unavailable',
            }
          : {},
      },
    ],
  };
}

export default async function handler(req, res) {
  const { word } = req.query;

  if (!word) {
    return res.status(400).json({ error: 'Word parameter required' });
  }

  try {
    console.log('[api/wordinfo] Fetching info for word:', word);

    const url = `${BASE_URL}/${encodeURIComponent(word)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'lingua-robot.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
    });

    console.log('[api/wordinfo] API Response status:', response.status);

    if (!response.ok) {
      console.warn('[api/wordinfo] API error:', response.status, response.statusText);
      // Return fallback data instead of throwing error
      return res.status(200).json(createFallbackData(word));
    }

    const data = await response.json();
    console.log('[api/wordinfo] API Success! Entries count:', data.entries?.length);

    // Validate response
    if (!data.entries || !Array.isArray(data.entries) || data.entries.length === 0) {
      console.warn('[api/wordinfo] No entries in API response');
      return res.status(200).json(createFallbackData(word));
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[api/wordinfo] Error:', error.message);
    // Return fallback data on error
    return res.status(200).json(createFallbackData(word));
  }
}
