// api/wordinfo.js
// Serverless endpoint for Spanish word lookup using Google Generative AI SDK

import { GoogleGenerativeAI } from '@google/generative-ai';

// Each entry: [modelName, apiVersion]
const MODEL_CONFIGS = [
  ['gemini-2.0-flash', 'v1beta'],
  ['gemini-2.0-flash', 'v1'],
  ['gemini-1.5-flash', 'v1beta'],
  ['gemini-1.5-flash', 'v1'],
  ['gemini-1.5-flash-latest', 'v1beta'],
  ['gemini-1.5-flash-latest', 'v1'],
  ['gemini-pro', 'v1beta'],
  ['gemini-pro', 'v1'],
  ['gemini-1.0-pro', 'v1beta'],
  ['gemini-1.0-pro', 'v1'],
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
    { "text": "English definition", "examples": [{ "spanish": "Example sentence", "english": "Translation" }] }
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
    { "tense": "Presente", "spanish": "Sentence in present", "english": "Translation" },
    { "tense": "Pretérito", "spanish": "Sentence in past", "english": "Translation" },
    { "tense": "Futuro", "spanish": "Sentence in future", "english": "Translation" }
  ],
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1"]
}

RULES:
- "conjugations" ONLY for verbs. null for other parts of speech.
- "gender" and "article" ONLY for nouns. null for others.
- "isIrregular" ONLY for verbs. null for others.
- For reflexive verbs, show reflexive forms (me levanto, te levantas...).
- Always include 3 "tenseExamples" (present, past, future).
- Include 1-3 definitions with 1-2 example sentences each.
- If the word is not Spanish, set partOfSpeech to "unknown".
- ALL conjugations must be accurate.
- Return ONLY valid JSON.`;
}

function makeEmptyEntry(word, errorMsg) {
  return {
    word,
    success: false,
    debugError: errorMsg || null,
    entries: [{
      partOfSpeech: 'unknown',
      definitions: [{ text: 'Could not look up "' + word + '". Please try again.', examples: [] }],
      conjugations: null, tenseExamples: [], synonyms: [], antonyms: [],
      gender: null, article: null, isIrregular: null,
    }],
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { word } = req.query;

  // Debug: list available models
  if (word === '__list_models__') {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await resp.json();
      const resp2 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      const data2 = await resp2.json();
      return res.status(200).json({ v1beta: data, v1: data2 });
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  if (!word || !word.trim()) {
    return res.status(400).json({ error: 'Word parameter required' });
  }

  const cleanWord = word.trim().toLowerCase();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json(makeEmptyEntry(cleanWord, 'GEMINI_API_KEY not configured'));
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildPrompt(cleanWord);
    let rawText = '';
    let lastError = '';

    // Try each model/version combo
    for (const [modelName, apiVersion] of MODEL_CONFIGS) {
      try {
        console.log('[wordinfo] Trying model:', modelName, 'version:', apiVersion);
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion });
        const result = await model.generateContent(prompt);
        const response = result.response;
        rawText = response.text() || '';
        if (rawText) {
          console.log('[wordinfo] Model', modelName, 'returned', rawText.length, 'chars');
          break;
        }
        lastError = 'Empty response from ' + modelName + '/' + apiVersion;
      } catch (modelErr) {
        lastError = modelErr.message || String(modelErr);
        console.error('[wordinfo] Model', modelName, '/', apiVersion, 'failed:', lastError);
      }
    }

    if (!rawText) {
      return res.status(200).json(makeEmptyEntry(cleanWord, lastError));
    }

    // Parse JSON from response (may be wrapped in markdown code blocks)
    let parsed;
    try {
      // Strip markdown code fences if present
      let jsonStr = rawText.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      // Try extracting JSON object from text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          return res.status(200).json(makeEmptyEntry(cleanWord, 'JSON parse error: ' + parseErr.message));
        }
      } else {
        return res.status(200).json(makeEmptyEntry(cleanWord, 'No JSON in response'));
      }
    }

    // Normalize response
    const entry = {
      partOfSpeech: parsed.partOfSpeech || 'unknown',
      definitions: Array.isArray(parsed.definitions) ? parsed.definitions.map(d => ({
        text: d.text || '', examples: Array.isArray(d.examples) ? d.examples.map(ex => ({
          spanish: ex.spanish || '', english: ex.english || '',
        })) : [],
      })) : [],
      conjugations: null,
      tenseExamples: Array.isArray(parsed.tenseExamples) ? parsed.tenseExamples.map(ex => ({
        tense: ex.tense || '', spanish: ex.spanish || '', english: ex.english || '',
      })) : [],
      synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
      antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
      gender: parsed.gender || null,
      article: parsed.article || null,
      isIrregular: parsed.isIrregular ?? null,
    };

    // Validate conjugations
    if (parsed.conjugations && typeof parsed.conjugations === 'object') {
      const valid = {};
      for (const [tense, forms] of Object.entries(parsed.conjugations)) {
        if (Array.isArray(forms) && forms.length > 0) {
          valid[tense] = forms.map(f => ({ person: f.person || '', form: f.form || '' }));
        }
      }
      if (Object.keys(valid).length > 0) entry.conjugations = valid;
    }

    console.log('[wordinfo] Success:', cleanWord, '->', entry.partOfSpeech);
    return res.status(200).json({ word: parsed.word || cleanWord, success: true, entries: [entry] });
  } catch (error) {
    console.error('[wordinfo] Error:', error.message);
    return res.status(200).json(makeEmptyEntry(cleanWord, error.message));
  }
}
