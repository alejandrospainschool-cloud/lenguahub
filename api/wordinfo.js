// api/wordinfo.js
// Spanish word lookup using Wiktionary (definitions) + spanish-verbs (conjugations)
// No API key needed — fully free & reliable

import spanishVerbs from 'spanish-verbs';

const { getConjugation } = spanishVerbs;

// ─── Conjugation helpers ───────────────────────────────────────────────

const PERSON_LABELS = [
  'yo', 'tú', 'él/ella/usted', 'nosotros', 'vosotros', 'ellos/ellas/ustedes',
];

const TENSE_MAP = {
  'Presente':              'INDICATIVE_PRESENT',
  'Pretérito Indefinido':  'INDICATIVE_PRETERITE',
  'Pretérito Imperfecto':  'INDICATIVE_IMPERFECT',
  'Futuro Simple':         'INDICATIVE_FUTURE',
  'Condicional':           'CONDITIONAL_PRESENT',
  'Subjuntivo Presente':   'SUBJUNCTIVE_PRESENT',
};

function conjugateVerb(infinitive) {
  const tables = {};
  let anySuccess = false;

  for (const [label, libTense] of Object.entries(TENSE_MAP)) {
    const forms = [];
    for (let p = 0; p < 6; p++) {
      try {
        const form = getConjugation(infinitive, libTense, p);
        forms.push({ person: PERSON_LABELS[p], form });
      } catch {
        forms.push({ person: PERSON_LABELS[p], form: '—' });
      }
    }
    if (forms.some(f => f.form !== '—')) {
      tables[label] = forms;
      anySuccess = true;
    }
  }

  return anySuccess ? tables : null;
}

// ─── Wiktionary helpers ────────────────────────────────────────────────

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWiktionary(word) {
  const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
  const resp = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'LenguaHub/1.0' },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const esEntries = data.es || data.ES || [];
  return esEntries.length > 0 ? esEntries : null;
}

// Priority order for POS — most "important" first
const POS_PRIORITY = ['verb', 'noun', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'phrase', 'unknown'];

const MAX_DEFINITIONS = 5;
const MAX_EXAMPLES_PER_DEF = 2;

function parseWiktionaryEntries(esEntries, word) {
  // First pass: collect all POS groups with their definitions
  const posGroups = {};

  for (const entry of esEntries) {
    const rawPos = (entry.partOfSpeech || 'unknown');
    const pos = rawPos.toLowerCase();

    // Skip entries that are just conjugated forms of another verb
    const isVerbForm = pos === 'verb' &&
      entry.definitions?.length <= 2 &&
      entry.definitions?.every(d => d.definition && /form-of-definition/.test(d.definition));
    if (isVerbForm) continue;

    const definitions = [];
    for (const defn of (entry.definitions || [])) {
      const text = stripHtml(defn.definition);
      if (!text || /form-of-definition/.test(defn.definition)) continue;

      // Cap examples per definition
      const examples = [];
      if (defn.parsedExamples) {
        for (let i = 0; i < Math.min(MAX_EXAMPLES_PER_DEF, defn.parsedExamples.length); i++) {
          const ex = defn.parsedExamples[i];
          examples.push({
            spanish: stripHtml(ex.example),
            english: stripHtml(ex.translation || ''),
          });
        }
      }
      definitions.push({ text, examples });
    }

    if (definitions.length === 0) continue;

    // Accumulate into POS group
    if (!posGroups[pos]) {
      posGroups[pos] = { rawPos, definitions: [], examples: [] };
    }
    posGroups[pos].definitions.push(...definitions);
  }

  // If no valid groups, return empty
  if (Object.keys(posGroups).length === 0) return [];

  // Pick the primary POS by priority
  const sortedPosKeys = Object.keys(posGroups).sort((a, b) => {
    const ai = POS_PRIORITY.indexOf(a);
    const bi = POS_PRIORITY.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const primaryPos = sortedPosKeys[0];
  const group = posGroups[primaryPos];

  // Cap total definitions
  const definitions = group.definitions.slice(0, MAX_DEFINITIONS);

  // Also note secondary POS for display
  const otherPos = sortedPosKeys.slice(1);

  // If there's an "interjection" as secondary and primary is noun/adj, fold a note into definitions
  // OR if primary is interjection but there's a noun/adj/verb, swap
  // (already handled by priority sort above)

  // Detect gender for nouns
  let gender = null;
  let article = null;
  if (primaryPos === 'noun') {
    const rawPos = group.rawPos || '';
    if (/feminine/i.test(rawPos)) { gender = 'feminine'; article = 'la'; }
    else if (/masculine/i.test(rawPos)) { gender = 'masculine'; article = 'el'; }
    else {
      if (word.endsWith('a') || word.endsWith('ión') || word.endsWith('dad') || word.endsWith('tud')) {
        gender = 'feminine'; article = 'la';
      } else if (word.endsWith('o') || word.endsWith('or') || word.endsWith('aje')) {
        gender = 'masculine'; article = 'el';
      }
    }
  }

  // Get conjugations for verbs
  let conjugations = null;
  let isIrregular = null;
  if (primaryPos === 'verb') {
    let infinitive = word;
    if (word.endsWith('se')) infinitive = word.slice(0, -2);
    conjugations = conjugateVerb(infinitive);

    if (conjugations) {
      try {
        const yo = getConjugation(infinitive, 'INDICATIVE_PRESENT', 0);
        const stem = infinitive.replace(/(ar|er|ir)$/, '');
        isIrregular = yo !== stem + 'o';
      } catch { isIrregular = null; }
    }
  }

  // Build tense examples
  const tenseExamples = [];

  // For verbs, generate tense-specific examples from conjugations
  if (primaryPos === 'verb' && conjugations) {
    const inf = word.endsWith('se') ? word.slice(0, -2) : word;
    try {
      const pr = getConjugation(inf, 'INDICATIVE_PRESENT', 0);
      tenseExamples.push({ tense: 'Presente', spanish: `Yo ${pr} todos los días.`, english: '(Present tense)' });
    } catch { /* skip */ }
    try {
      const pt = getConjugation(inf, 'INDICATIVE_PRETERITE', 0);
      tenseExamples.push({ tense: 'Pretérito', spanish: `Yo ${pt} ayer.`, english: '(Past tense)' });
    } catch { /* skip */ }
    try {
      const ft = getConjugation(inf, 'INDICATIVE_FUTURE', 0);
      tenseExamples.push({ tense: 'Futuro', spanish: `Yo ${ft} mañana.`, english: '(Future tense)' });
    } catch { /* skip */ }
  }

  // Add Wiktionary examples (max 3 total)
  const allExamples = definitions.flatMap(d => d.examples).filter(e => e.spanish);
  for (let i = 0; i < Math.min(3, allExamples.length); i++) {
    tenseExamples.push({
      tense: `Ejemplo ${i + 1}`,
      spanish: allExamples[i].spanish,
      english: allExamples[i].english,
    });
  }

  // Build the single merged entry
  const result = {
    partOfSpeech: primaryPos,
    alsoUsedAs: otherPos.length > 0 ? otherPos : undefined,
    definitions,
    conjugations,
    tenseExamples,
    synonyms: [],
    antonyms: [],
    gender,
    article,
    isIrregular,
  };

  return [result];
}

// ─── Handler ───────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { word } = req.query;
  if (!word || !word.trim()) {
    return res.status(400).json({ error: 'Word parameter required' });
  }

  const cleanWord = word.trim().toLowerCase();

  try {
    const esEntries = await fetchWiktionary(cleanWord);

    if (!esEntries) {
      // Word not found in Wiktionary — try it as a verb anyway
      const conjugations = conjugateVerb(cleanWord);
      if (conjugations) {
        return res.status(200).json({
          word: cleanWord, success: true,
          entries: [{
            partOfSpeech: 'verb',
            definitions: [{ text: '(Conjugation available — definition not found in dictionary)', examples: [] }],
            conjugations, tenseExamples: [], synonyms: [], antonyms: [],
            gender: null, article: null, isIrregular: null,
          }],
        });
      }

      return res.status(200).json({
        word: cleanWord, success: false,
        entries: [{
          partOfSpeech: 'unknown',
          definitions: [{ text: `"${cleanWord}" was not found. Check spelling and try again.`, examples: [] }],
          conjugations: null, tenseExamples: [], synonyms: [], antonyms: [],
          gender: null, article: null, isIrregular: null,
        }],
      });
    }

    const entries = parseWiktionaryEntries(esEntries, cleanWord);

    if (entries.length === 0) {
      return res.status(200).json({
        word: cleanWord, success: false,
        entries: [{
          partOfSpeech: 'unknown',
          definitions: [{ text: `"${cleanWord}" — no Spanish definitions found.`, examples: [] }],
          conjugations: null, tenseExamples: [], synonyms: [], antonyms: [],
          gender: null, article: null, isIrregular: null,
        }],
      });
    }

    console.log('[wordinfo]', cleanWord, '→', entries.map(e => e.partOfSpeech).join(', '));
    return res.status(200).json({ word: cleanWord, success: true, entries });

  } catch (error) {
    console.error('[wordinfo] Error:', error);
    return res.status(200).json({
      word: cleanWord, success: false, debugError: error.message,
      entries: [{
        partOfSpeech: 'unknown',
        definitions: [{ text: `Error looking up "${cleanWord}". Please try again.`, examples: [] }],
        conjugations: null, tenseExamples: [], synonyms: [], antonyms: [],
        gender: null, article: null, isIrregular: null,
      }],
    });
  }
}
