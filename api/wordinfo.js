// api/wordinfo.js
// Serverless endpoint for comprehensive Spanish word lookup using Gemini AI
// Returns definitions, conjugations, tense examples, synonyms, and more

const MODELS = [
  { version: 'v1beta', model: 'gemini-2.0-flash' },
  { version: 'v1beta', model: 'gemini-1.5-flash' },
  { version: 'v1', model: 'gemini-2.0-flash' },
  { version: 'v1', model: 'gemini-1.5-flash' },
  { version: 'v1beta', model: 'gemini-pro' },
  { version: 'v1', model: 'gemini-pro' },
];

function buildPrompt(word) {
  return `You are a precise Spanish-English dictionary API. Given the Spanish word "${word}", return a single JSON object with comprehensive linguistic information.

Return this EXACT JSON structure (no markdown, no backticks, just raw JSON):
{
  "word": "${word}",
  "partOfSpeech": "verb|noun|adjective|adverb|pronoun|preposition|conjunction|interjection|phrase",
  "gender": "masculine|feminine|null",
  "article": "el|la|los|las|null",
  "isIrregular": true or false (only for verbs),
  "definitions": [
    {
      "text": "English definition",
      "examples": [
        { "spanish": "Example sentence using the word", "english": "Translation" }
      ]
    }
  ],
  "conjugations": {
    "Presente": [
      { "person": "yo", "form": "..." },
      { "person": "tú", "form": "..." },
      { "person": "él/ella/usted", "form": "..." },
      { "person": "nosotros", "form": "..." },
      { "person": "vosotros", "form": "..." },
      { "person": "ellos/ellas/ustedes", "form": "..." }
    ],
    "Pretérito Indefinido": [ same structure ],
    "Pretérito Imperfecto": [ same structure ],
    "Futuro Simple": [ same structure ],
    "Condicional": [ same structure ],
    "Subjuntivo Presente": [ same structure ]
  },
  "tenseExamples": [
    { "tense": "Presente", "spanish": "Natural sentence in present tense", "english": "Translation" },
    { "tense": "Pretérito", "spanish": "Natural sentence in past tense", "english": "Translation" },
    { "tense": "Futuro", "spanish": "Natural sentence in future tense", "english": "Translation" }
  ],
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1"]
}

RULES:
- "conjugations" must ONLY be included for verbs. Set to null for other parts of speech.
- "gender" and "article" are ONLY for nouns. Set to null for other parts of speech.
- "isIrregular" is ONLY for verbs. Set to null for other parts of speech.
- For reflexive verbs (e.g. levantarse), show reflexive forms in conjugations (me levanto, te levantas...).
- Always include 3 "tenseExamples" showing the word used naturally in present, past, and future contexts.
- Include 1-3 definitions ordered by most common usage.
- Each definition should have 1-2 example sentences.
- Synonyms and antonyms should be common Spanish words.
- If the word is not a real Spanish word, set partOfSpeech to "unknown" and provide a helpful message in definitions.
- ALL conjugation forms must be accurate. Double-check irregular verbs.
- Return ONLY valid JSON. No explanations, no markdown.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { word } = req.query;

  if (!word || !word.trim()) {
    return res.status(400).json({ error: 'Word parameter required' });
  }

  const cleanWord = word.trim().toLowerCase();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('[api/wordinfo] GEMINI_API_KEY not configured');
    return res.status(200).json({
      word: cleanWord,
      success: false,
      entries: [{
        partOfSpeech: 'unknown',
        definitions: [{ text: 'Word lookup service not configured. Please contact support.', examples: [] }],
        conjugations: null,
        tenseExamples: [],
        synonyms: [],
        antonyms: [],
        gender: null,
        article: null,
      }],
    });
  }

  try {
    console.log('[api/wordinfo] Looking up:', cleanWord);

    const prompt = buildPrompt(cleanWord);

    // Try models in order until one works
    let text = '';
    let lastError = '';
    for (const { version, model } of MODELS) {
      try {
        console.log('[api/wordinfo] Trying', version + '/' + model);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          lastError = errorData?.error?.message || 'HTTP ' + response.status;
          console.error('[api/wordinfo]', version + '/' + model, 'error:', lastError);
          continue;
        }

        const data = await response.json();
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          console.log('[api/wordinfo]', version + '/' + model, 'returned', text.length, 'chars');
          break;
        }
        lastError = 'Empty response';
      } catch (modelErr) {
        lastError = modelErr.message || 'Unknown error';
        console.error('[api/wordinfo]', version + '/' + model, 'exception:', lastError);
      }
    }

    if (!text) {
      throw new Error(lastError || 'All models failed');
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Normalize and validate the response
    const entry = {
      partOfSpeech: parsed.partOfSpeech || 'unknown',
      definitions: Array.isArray(parsed.definitions) ? parsed.definitions.map(d => ({
        text: d.text || '',
        examples: Array.isArray(d.examples) ? d.examples.map(ex => ({
          spanish: ex.spanish || '',
          english: ex.english || '',
        })) : [],
      })) : [],
      conjugations: parsed.conjugations || null,
      tenseExamples: Array.isArray(parsed.tenseExamples) ? parsed.tenseExamples.map(ex => ({
        tense: ex.tense || '',
        spanish: ex.spanish || '',
        english: ex.english || '',
      })) : [],
      synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
      antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
      gender: parsed.gender || null,
      article: parsed.article || null,
      isIrregular: parsed.isIrregular ?? null,
    };

    // Validate conjugations structure if present
    if (entry.conjugations) {
      const validConjugations = {};
      for (const [tense, forms] of Object.entries(entry.conjugations)) {
        if (Array.isArray(forms) && forms.length > 0) {
          validConjugations[tense] = forms.map(f => ({
            person: f.person || '',
            form: f.form || '',
          }));
        }
      }
      entry.conjugations = Object.keys(validConjugations).length > 0 ? validConjugations : null;
    }

    console.log('[api/wordinfo] Success:', cleanWord, '->', entry.partOfSpeech);

    return res.status(200).json({
      word: parsed.word || cleanWord,
      success: true,
      entries: [entry],
    });
  } catch (error) {
    console.error('[api/wordinfo] Error:', error.message);
    return res.status(200).json({
      word: cleanWord,
      success: false,
      debugError: error.message,
      entries: [{
        partOfSpeech: 'unknown',
        definitions: [{ text: 'Could not look up "' + cleanWord + '". Please try again.', examples: [] }],
        conjugations: null,
        tenseExamples: [],
        synonyms: [],
        antonyms: [],
        gender: null,
        article: null,
      }],
    });
  }
}
