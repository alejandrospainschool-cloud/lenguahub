// api/wordinfo.js
// Server-side endpoint for fetching word information from Lingua Robot API
// This avoids CORS issues and keeps the API key secure

const API_KEY = 'b0cb62497emshb7e9ff7dd84d939p1acf82jsnac2aa7ce67ad';
const BASE_URL = 'https://lingua-robot.p.rapidapi.com/language/v1/entries/es';

/**
 * Comprehensive Spanish word database with conjugations, gender, and definitions
 */
const SPANISH_WORDS_DB = {
  // AR VERBS (infinitive ending in -ar)
  hablar: {
    word: 'hablar',
    partOfSpeech: 'verb',
    verbType: 'regular ar-verb',
    infinitive: 'hablar',
    definitions: [{ text: 'to speak, to talk' }],
    conjugations: {
      'Present Indicative': ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'],
      'Preterite': ['hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron'],
      'Imperfect': ['hablaba', 'hablabas', 'hablaba', 'hablábamos', 'hablabais', 'hablaban'],
      'Future': ['hablaré', 'hablarás', 'hablará', 'hablaremos', 'hablaréis', 'hablarán'],
    },
    irregular: false,
  },
  confiar: {
    word: 'confiar',
    partOfSpeech: 'verb',
    verbType: 'regular ar-verb',
    infinitive: 'confiar',
    definitions: [{ text: 'to trust, to confide' }],
    conjugations: {
      'Present Indicative': ['confío', 'confías', 'confía', 'confiamos', 'confiáis', 'confían'],
      'Preterite': ['confié', 'confiaste', 'confió', 'confiamos', 'confiasteis', 'confiaron'],
      'Imperfect': ['confiaba', 'confiabas', 'confiaba', 'confiábamos', 'confiabais', 'confiaban'],
      'Future': ['confiaré', 'confiarás', 'confiará', 'confiaremos', 'confiaréis', 'confiarán'],
    },
    irregular: false,
  },
  trabajar: {
    word: 'trabajar',
    partOfSpeech: 'verb',
    verbType: 'regular ar-verb',
    infinitive: 'trabajar',
    definitions: [{ text: 'to work' }],
    conjugations: {
      'Present Indicative': ['trabajo', 'trabajas', 'trabaja', 'trabajamos', 'trabajáis', 'trabajan'],
      'Preterite': ['trabajé', 'trabajaste', 'trabajó', 'trabajamos', 'trabajasteis', 'trabajaron'],
      'Imperfect': ['trabajaba', 'trabajabas', 'trabajaba', 'trabajábamos', 'trabajabais', 'trabajaban'],
      'Future': ['trabajaré', 'trabajarás', 'trabajará', 'trabajaremos', 'trabajaréis', 'trabajarán'],
    },
    irregular: false,
  },
  // ER VERBS (infinitive ending in -er)
  comer: {
    word: 'comer',
    partOfSpeech: 'verb',
    verbType: 'regular er-verb',
    infinitive: 'comer',
    definitions: [{ text: 'to eat' }],
    conjugations: {
      'Present Indicative': ['como', 'comes', 'come', 'comemos', 'coméis', 'comen'],
      'Preterite': ['comí', 'comiste', 'comió', 'comimos', 'comisteis', 'comieron'],
      'Imperfect': ['comía', 'comías', 'comía', 'comíamos', 'comíais', 'comían'],
      'Future': ['comeré', 'comerás', 'comerá', 'comeremos', 'comeréis', 'comerán'],
    },
    irregular: false,
  },
  beber: {
    word: 'beber',
    partOfSpeech: 'verb',
    verbType: 'regular er-verb',
    infinitive: 'beber',
    definitions: [{ text: 'to drink' }],
    conjugations: {
      'Present Indicative': ['bebo', 'bebes', 'bebe', 'bebemos', 'bebéis', 'beben'],
      'Preterite': ['bebí', 'bebiste', 'bebió', 'bebimos', 'bebisteis', 'bebieron'],
      'Imperfect': ['bebía', 'bebías', 'bebía', 'bebíamos', 'bebíais', 'bebían'],
      'Future': ['beberé', 'beberás', 'beberá', 'beberemos', 'beberéis', 'beberán'],
    },
    irregular: false,
  },
  // IR VERBS (infinitive ending in -ir)
  vivir: {
    word: 'vivir',
    partOfSpeech: 'verb',
    verbType: 'regular ir-verb',
    infinitive: 'vivir',
    definitions: [{ text: 'to live' }],
    conjugations: {
      'Present Indicative': ['vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven'],
      'Preterite': ['viví', 'viviste', 'vivió', 'vivimos', 'vivisteis', 'vivieron'],
      'Imperfect': ['vivía', 'vivías', 'vivía', 'vivíamos', 'vivíais', 'vivían'],
      'Future': ['viviré', 'vivirás', 'vivirá', 'viviremos', 'viviréis', 'vivirán'],
    },
    irregular: false,
  },
  escribir: {
    word: 'escribir',
    partOfSpeech: 'verb',
    verbType: 'regular ir-verb',
    infinitive: 'escribir',
    definitions: [{ text: 'to write' }],
    conjugations: {
      'Present Indicative': ['escribo', 'escribes', 'escribe', 'escribimos', 'escribís', 'escriben'],
      'Preterite': ['escribí', 'escribiste', 'escribió', 'escribimos', 'escribisteis', 'escribieron'],
      'Imperfect': ['escribía', 'escribías', 'escribía', 'escribíamos', 'escribíais', 'escribían'],
      'Future': ['escribiré', 'escribirás', 'escribirá', 'escribiremos', 'escribiréis', 'escribirán'],
    },
    irregular: false,
  },
  // IRREGULAR VERBS
  ser: {
    word: 'ser',
    partOfSpeech: 'verb',
    verbType: 'irregular verb',
    infinitive: 'ser',
    definitions: [{ text: 'to be (permanent state/identity)' }],
    conjugations: {
      'Present Indicative': ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
      'Preterite': ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      'Imperfect': ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
      'Future': ['seré', 'serás', 'será', 'seremos', 'seréis', 'serán'],
    },
    irregular: true,
  },
  estar: {
    word: 'estar',
    partOfSpeech: 'verb',
    verbType: 'irregular verb',
    infinitive: 'estar',
    definitions: [{ text: 'to be (location/condition)' }],
    conjugations: {
      'Present Indicative': ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
      'Preterite': ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
      'Imperfect': ['estaba', 'estabas', 'estaba', 'estábamos', 'estabais', 'estaban'],
      'Future': ['estaré', 'estarás', 'estará', 'estaremos', 'estaréis', 'estarán'],
    },
    irregular: true,
  },
  tener: {
    word: 'tener',
    partOfSpeech: 'verb',
    verbType: 'irregular verb',
    infinitive: 'tener',
    definitions: [{ text: 'to have' }],
    conjugations: {
      'Present Indicative': ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'],
      'Preterite': ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'],
      'Imperfect': ['tenía', 'tenías', 'tenía', 'teníamos', 'teníais', 'tenían'],
      'Future': ['tendré', 'tendrás', 'tendrá', 'tendremos', 'tendréis', 'tendrán'],
    },
    irregular: true,
  },
  ir: {
    word: 'ir',
    partOfSpeech: 'verb',
    verbType: 'irregular verb',
    infinitive: 'ir',
    definitions: [{ text: 'to go' }],
    conjugations: {
      'Present Indicative': ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
      'Preterite': ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      'Imperfect': ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
      'Future': ['iré', 'irás', 'irá', 'iremos', 'iréis', 'irán'],
    },
    irregular: true,
  },
  hacer: {
    word: 'hacer',
    partOfSpeech: 'verb',
    verbType: 'irregular verb',
    infinitive: 'hacer',
    definitions: [{ text: 'to do, to make' }],
    conjugations: {
      'Present Indicative': ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'],
      'Preterite': ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
      'Imperfect': ['hacía', 'hacías', 'hacía', 'hacíamos', 'hacíais', 'hacían'],
      'Future': ['haré', 'harás', 'hará', 'haremos', 'haréis', 'harán'],
    },
    irregular: true,
  },
  // NOUNS
  casa: {
    word: 'casa',
    partOfSpeech: 'noun',
    definitions: [{ text: 'house' }],
    gender: 'feminine',
  },
  libro: {
    word: 'libro',
    partOfSpeech: 'noun',
    definitions: [{ text: 'book' }],
    gender: 'masculine',
  },
  mesa: {
    word: 'mesa',
    partOfSpeech: 'noun',
    definitions: [{ text: 'table' }],
    gender: 'feminine',
  },
  gato: {
    word: 'gato',
    partOfSpeech: 'noun',
    definitions: [{ text: 'cat' }],
    gender: 'masculine',
  },
  escuela: {
    word: 'escuela',
    partOfSpeech: 'noun',
    definitions: [{ text: 'school' }],
    gender: 'feminine',
  },
};

/**
 * Creates structured word data from database
 */
function getWordFromDatabase(word) {
  const lowerWord = word.toLowerCase();
  const wordData = SPANISH_WORDS_DB[lowerWord];

  if (!wordData) {
    return null;
  }

  // Format response to match Lingua Robot API structure
  const entry = {
    word: wordData.word,
    partOfSpeech: wordData.partOfSpeech,
    definitions: wordData.definitions,
  };

  if (wordData.gender) {
    entry.genders = [wordData.gender];
  }

  if (wordData.verbType) {
    entry.partOfSpeechDetail = wordData.verbType;
  }

  if (wordData.conjugations) {
    entry.conjugations = wordData.conjugations;
  }

  if (wordData.irregular) {
    entry.irregular = true;
  }

  return {
    word,
    success: true,
    entries: [entry],
  };
}

export default async function handler(req, res) {
  const { word } = req.query;

  if (!word) {
    return res.status(400).json({ error: 'Word parameter required' });
  }

  try {
    console.log('[api/wordinfo] Looking up word:', word);

    // First, try database
    const dbResult = getWordFromDatabase(word);
    if (dbResult) {
      console.log('[api/wordinfo] Found in database!');
      return res.status(200).json(dbResult);
    }

    // If not in database, try Lingua Robot API
    console.log('[api/wordinfo] Not in database, trying Lingua Robot API...');
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

    if (response.ok) {
      const data = await response.json();
      if (data.entries && data.entries.length > 0) {
        console.log('[api/wordinfo] API Success!');
        return res.status(200).json(data);
      }
    }

    // Fallback: return generic response for unknown words
    console.log('[api/wordinfo] Word not found in API, returning generic entry');
    return res.status(200).json({
      word,
      success: false,
      entries: [
        {
          word,
          partOfSpeech: 'unknown',
          definitions: [{ text: `Definition not available for '${word}'` }],
        },
      ],
    });
  } catch (error) {
    console.error('[api/wordinfo] Error:', error.message);
    return res.status(200).json({
      word,
      success: false,
      entries: [
        {
          word,
          partOfSpeech: 'unknown',
          definitions: [{ text: `Error looking up '${word}'` }],
        },
      ],
    });
  }
}
