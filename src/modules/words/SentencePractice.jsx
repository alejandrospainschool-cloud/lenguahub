// src/modules/words/SentencePractice.jsx
import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  X, Loader2, ArrowRightLeft, RefreshCw, CheckCircle2,
  XCircle, Sparkles, Send, BookOpen, ChevronRight,
} from 'lucide-react'
import { generateContent } from '../../lib/ai'

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractJson(text) {
  if (!text) return null
  let cleaned = String(text).trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }
  try { return JSON.parse(cleaned) } catch { return null }
}

/** Pick n random items from an array */
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/**
 * Compare a word token against a bank term.
 * Strips punctuation and accents for a loose match.
 */
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // strip accents
    .replace(/[^a-z0-9]/g, '')                           // strip punctuation
}

// ─── Sentence Display with Highlighting ─────────────────────────────────────

function HighlightedSentence({ tokens }) {
  if (!tokens?.length) return null
  return (
    <p className="text-lg sm:text-xl leading-relaxed">
      {tokens.map((tok, i) => {
        if (tok.fromBank) {
          const color = tok.color || '#3b82f6'
          return (
            <span
              key={i}
              className="relative inline-block font-bold"
              style={{ color }}
              title={tok.bankTerm ? `From your word bank: ${tok.bankTerm}` : 'From your word bank'}
            >
              <span
                className="absolute inset-x-0 bottom-0 h-[3px] rounded-full"
                style={{ backgroundColor: `${color}66` }}
              />
              {tok.text}
            </span>
          )
        }
        return (
          <span key={i} className="text-slate-300">{tok.text}</span>
        )
      })}
    </p>
  )
}

// ─── Direction Toggle ───────────────────────────────────────────────────────

function DirectionToggle({ direction, onChange }) {
  return (
    <button
      onClick={() => onChange(direction === 'es-en' ? 'en-es' : 'es-en')}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-white/5 text-xs font-bold text-slate-400 hover:text-white hover:border-white/10 transition-all"
    >
      <span className={direction === 'es-en' ? 'text-blue-400' : 'text-slate-400'}>
        {direction === 'es-en' ? '🇪🇸 ES' : '🇬🇧 EN'}
      </span>
      <ArrowRightLeft size={12} />
      <span className={direction === 'es-en' ? 'text-slate-400' : 'text-blue-400'}>
        {direction === 'es-en' ? '🇬🇧 EN' : '🇪🇸 ES'}
      </span>
    </button>
  )
}

// ─── Difficulty Selector ────────────────────────────────────────────────────

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   desc: 'Simple sentences, 4-6 words',  color: 'text-emerald-400', wordCount: '1-2' },
  { id: 'medium', label: 'Medium', desc: 'Everyday sentences, 6-10 words', color: 'text-amber-400',   wordCount: '2-3' },
  { id: 'hard',   label: 'Hard',   desc: 'Complex sentences, 10-15 words', color: 'text-red-400',     wordCount: '3-4' },
]

function DifficultySelector({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {DIFFICULTIES.map(d => (
        <button
          key={d.id}
          onClick={() => onChange(d.id)}
          className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
            value === d.id
              ? 'bg-white/10 border-white/10 text-white shadow-sm'
              : 'bg-slate-900/40 border-white/[.03] text-slate-500 hover:text-slate-300 hover:border-white/5'
          }`}
        >
          <span className={value === d.id ? d.color : ''}>{d.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SentencePractice({ words, onClose }) {
  const [direction, setDirection] = useState('es-en')     // es-en = read Spanish, type English
  const [difficulty, setDifficulty] = useState('medium')
  const [generating, setGenerating] = useState(false)
  const [checking, setChecking] = useState(false)
  const [sentence, setSentence] = useState(null)           // { tokens, original, translation, bankWordsUsed }
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)               // { correct, feedback, correctedAnswer }
  const [history, setHistory] = useState([])               // past results
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  // Build a map of normalized term → { term, color } for color-matching
  const bankMap = useMemo(() => {
    const map = new Map()
    words.forEach(w => {
      const t = w.term?.toLowerCase()
      if (t) map.set(normalize(t), { term: t, color: w.folderColor || '#3b82f6' })
    })
    return map
  }, [words])

  const bankTerms = useMemo(() => words.map(w => w.term?.toLowerCase()).filter(Boolean), [words])

  // ─── Generate a sentence ────────────────────────────────────────────────
  const generateSentence = useCallback(async () => {
    if (bankTerms.length === 0) {
      setError('Add some words to your word bank first!')
      return
    }

    setGenerating(true)
    setError(null)
    setSentence(null)
    setAnswer('')
    setResult(null)

    try {
      const diff = DIFFICULTIES.find(d => d.id === difficulty)
      const sampleSize = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4
      const selectedWords = pickRandom(bankTerms, sampleSize)

      const dirLabel = direction === 'es-en'
        ? 'a Spanish sentence (the student will translate to English)'
        : 'an English sentence (the student will translate to Spanish)'

      const prompt = `You are a Spanish language tutor. Generate ${dirLabel}.

STUDENT'S WORD BANK (use 1-${diff.wordCount} of these words in the sentence):
${selectedWords.map(w => `- ${w}`).join('\n')}

RULES:
- Difficulty: ${diff.label} – ${diff.desc}
- The sentence MUST be natural and grammatically correct
- Use word bank words in their correct conjugated/declined forms when needed
- Keep it age-appropriate and educational

Return ONLY valid JSON (no markdown, no extra text):
{
  "sentence": "the generated sentence",
  "translation": "accurate translation in the other language",
  "bankWordsUsed": ["list", "of", "bank", "words", "actually", "used"],
  "newWords": ["words", "not", "from", "bank"]
}`

      const raw = await generateContent(prompt)
      const data = extractJson(raw)

      if (!data?.sentence || !data?.translation) {
        throw new Error('Could not generate a valid sentence. Try again.')
      }

      // Tokenize the sentence and mark which words are from the bank
      const usedNormalized = new Set((data.bankWordsUsed || []).map(w => normalize(w)))
      // Also add the original selected words
      selectedWords.forEach(w => usedNormalized.add(normalize(w)))

      const sentenceText = data.sentence
      // Split into tokens keeping whitespace and punctuation attached
      const rawTokens = sentenceText.split(/(\s+)/)
      const tokens = rawTokens.map(segment => {
        if (/^\s+$/.test(segment)) {
          return { text: segment, fromBank: false }
        }
        const stripped = normalize(segment)
        // Check if this word matches any bank term (including conjugated forms)
        const match = bankMap.get(stripped)
        // Also check if AI reported it as a bank word used
        const isUsed = usedNormalized.has(stripped)
        if (match || isUsed) {
          return {
            text: segment,
            fromBank: true,
            color: match?.color || bankMap.values().next().value?.color || '#3b82f6',
            bankTerm: match?.term || stripped,
          }
        }
        return { text: segment, fromBank: false }
      })

      setSentence({
        tokens,
        original: data.sentence,
        translation: data.translation,
        bankWordsUsed: data.bankWordsUsed || [],
        newWords: data.newWords || [],
      })

      // Focus input after render
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (err) {
      setError(err.message || 'Failed to generate sentence')
    } finally {
      setGenerating(false)
    }
  }, [bankTerms, bankMap, direction, difficulty])

  // ─── Check the answer ───────────────────────────────────────────────────
  const checkAnswer = useCallback(async () => {
    if (!answer.trim() || !sentence) return

    setChecking(true)
    setError(null)

    try {
      const prompt = `You are grading a Spanish-English translation exercise.

ORIGINAL SENTENCE: "${sentence.original}"
CORRECT TRANSLATION: "${sentence.translation}"
STUDENT'S ANSWER: "${answer.trim()}"
DIRECTION: ${direction === 'es-en' ? 'Spanish → English' : 'English → Spanish'}

Grade the student's answer. Be lenient with:
- Minor spelling mistakes
- Slightly different but correct word choices (synonyms)
- Minor punctuation differences

But be strict with:
- Wrong meaning
- Missing key words
- Incorrect grammar that changes meaning

ALWAYS provide:
1. The correct/ideal translation
2. Specific tips on what could be improved (even if mostly correct)
3. If they got words wrong, explain what each mistranslated word actually means

Return ONLY valid JSON:
{
  "correct": true or false,
  "score": number 0-100,
  "feedback": "encouraging feedback explaining what was right/wrong",
  "correctedAnswer": "the ideal/best translation (always provide this, even if student was correct)",
  "improvements": ["specific tip 1 on how to improve", "specific tip 2 if applicable"]
}`

      const raw = await generateContent(prompt)
      const data = extractJson(raw)

      if (!data) {
        throw new Error('Could not grade the answer. Try again.')
      }

      const resultData = {
        correct: data.correct ?? data.score >= 70,
        score: data.score ?? (data.correct ? 100 : 0),
        feedback: data.feedback || '',
        correctedAnswer: data.correctedAnswer || sentence.translation,
        improvements: Array.isArray(data.improvements) ? data.improvements.filter(Boolean) : [],
        studentAnswer: answer.trim(),
        original: sentence.original,
        direction,
      }

      setResult(resultData)
      setHistory(prev => [resultData, ...prev].slice(0, 20))
    } catch (err) {
      setError(err.message || 'Failed to check answer')
    } finally {
      setChecking(false)
    }
  }, [answer, sentence, direction])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (result) {
        generateSentence()
      } else {
        checkAnswer()
      }
    }
  }

  const streak = useMemo(() => {
    let count = 0
    for (const r of history) {
      if (r.correct) count++
      else break
    }
    return count
  }, [history])

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0b1120] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/10">
                <Sparkles size={18} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Sentence Practice</h2>
                <p className="text-slate-500 text-xs">Translate sentences using your words</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <DirectionToggle direction={direction} onChange={setDirection} />
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          {/* Stats */}
          {history.length > 0 && (
            <div className="flex gap-3 mt-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {history.filter(r => r.correct).length}/{history.length} correct
              </span>
              {streak >= 2 && (
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  🔥 {streak} streak
                </span>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto min-h-0 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 py-3 px-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
              <XCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-red-300 text-xs">{error}</span>
            </div>
          )}

          {/* Empty state - no sentence yet */}
          {!sentence && !generating && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={28} className="text-blue-400" />
              </div>
              <p className="text-slate-300 text-sm font-medium mb-1">
                Ready to practice?
              </p>
              <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">
                Generate a sentence using words from your word bank, then translate it
              </p>
              <button
                onClick={generateSentence}
                disabled={bankTerms.length === 0}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/10 active:scale-[.97] transition-all"
              >
                <Sparkles size={16} />
                Generate Sentence
              </button>
              {bankTerms.length === 0 && (
                <p className="text-amber-400 text-xs mt-3">Add words to your bank first</p>
              )}
              {bankTerms.length > 0 && (
                <p className="text-slate-600 text-xs mt-3">{bankTerms.length} words in your bank</p>
              )}
            </div>
          )}

          {/* Loading */}
          {generating && (
            <div className="py-12 text-center">
              <Loader2 size={24} className="animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Crafting a sentence from your words...</p>
            </div>
          )}

          {/* Sentence display */}
          {sentence && !generating && (
            <div className="space-y-4">
              {/* Direction label */}
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>{direction === 'es-en' ? 'Translate to English' : 'Translate to Spanish'}</span>
              </div>

              {/* The sentence */}
              <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5">
                <HighlightedSentence tokens={sentence.tokens} />

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[.03] flex-wrap">
                  {sentence.tokens
                    .filter(t => t.fromBank && t.bankTerm)
                    .filter((t, i, arr) => arr.findIndex(x => x.bankTerm === t.bankTerm) === i)
                    .map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: `${t.color || '#3b82f6'}99` }} />
                        <span className="text-[10px] text-slate-500">{t.bankTerm}</span>
                      </div>
                    ))
                  }
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-[3px] rounded-full bg-slate-700" />
                    <span className="text-[10px] text-slate-500">New words</span>
                  </div>
                </div>

                {/* New words hint */}
                {sentence.newWords?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[.03]">
                    <details className="group">
                      <summary className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-400 transition-colors list-none flex items-center gap-1">
                        <ChevronRight size={10} className="transition-transform group-open:rotate-90" />
                        Hint: New vocabulary
                      </summary>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sentence.newWords.map((w, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-800/60 border border-white/5 rounded-lg text-xs text-slate-400"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {/* Answer input */}
              {!result && (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={direction === 'es-en' ? 'Type the English translation...' : 'Escribe la traducción en español...'}
                    disabled={checking}
                    className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={checkAnswer}
                    disabled={!answer.trim() || checking}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shrink-0 active:scale-[.97]"
                  >
                    {checking ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="space-y-3">
                  <div
                    className={`rounded-2xl border p-4 ${
                      result.correct
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.correct ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : (
                        <XCircle size={18} className="text-red-400" />
                      )}
                      <span
                        className={`font-bold text-sm ${
                          result.correct ? 'text-emerald-300' : 'text-red-300'
                        }`}
                      >
                        {result.correct ? 'Correct!' : 'Not quite'}
                      </span>
                      {result.score != null && (
                        <span className="text-[10px] font-bold text-slate-500 ml-auto">
                          {result.score}%
                        </span>
                      )}
                    </div>

                    {result.feedback && (
                      <p className="text-slate-300 text-sm leading-relaxed mb-2">
                        {result.feedback}
                      </p>
                    )}

                    {/* Always show correct answer */}
                    {result.correctedAnswer && (
                      <div className="mt-2 pt-2 border-t border-white/[.05]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          {result.correct ? 'Best translation' : 'Correct answer'}
                        </p>
                        <p className="text-white text-sm font-medium">
                          {result.correctedAnswer}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-white/[.05]">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Your answer
                      </p>
                      <p className="text-slate-400 text-sm">{result.studentAnswer}</p>
                    </div>

                    {/* Improvement tips */}
                    {result.improvements?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/[.05]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                          {result.correct ? 'Tips' : 'How to improve'}
                        </p>
                        <ul className="space-y-1.5">
                          {result.improvements.map((tip, i) => (
                            <li key={i} className="flex gap-2 items-start text-sm">
                              <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                              <span className="text-slate-300 leading-relaxed">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={generateSentence}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/10 active:scale-[.97] transition-all"
                  >
                    <RefreshCw size={14} />
                    Next Sentence
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
