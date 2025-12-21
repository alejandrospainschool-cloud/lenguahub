// src/modules/ai/Tools.jsx
import React, { useMemo, useState } from 'react'
import {
  Sparkles,
  Brain,
  FileText,
  Check,
  Plus,
  Wand2,
  Copy,
  Loader2,
  RotateCcw,
  Trash2,
  Save,
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { generateContent } from '../../lib/ai'

function safeJsonParse(maybeJson) {
  try {
    return JSON.parse(maybeJson)
  } catch {
    return null
  }
}

function clampItems(items, max = 10) {
  if (!Array.isArray(items)) return []
  return items
    .filter(Boolean)
    .slice(0, max)
    .map((x, idx) => ({
      id: x.id || `item:${(x.term || '').toLowerCase()}:${idx}`,
      term: String(x.term || '').trim(),
      translation: String(x.translation || '').trim(),
      definition: String(x.definition || '').trim(),
    }))
    .filter((x) => x.term)
}

export default function Tools({ user }) {
  const [activeTab, setActiveTab] = useState('vocab') // 'vocab' | 'summary'
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState(null)
  const [savedIDs, setSavedIDs] = useState([])
  const [toast, setToast] = useState('')

  const inputChars = inputText.length
  const inputWords = useMemo(() => {
    const t = inputText.trim()
    return t ? t.split(/\s+/).length : 0
  }, [inputText])

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 1500)
  }

  const vocabItems = results?.type === 'vocab' ? results.items : []
  const savedCount = useMemo(() => vocabItems.filter((i) => savedIDs.includes(i.id)).length, [vocabItems, savedIDs])

  const canGenerate = !!inputText.trim() && !isProcessing

  const processAI = async () => {
    if (!inputText.trim()) return
    setIsProcessing(true)
    setResults(null)

    try {
      if (activeTab === 'summary') {
        const prompt = `
You are a helpful assistant. Summarize the text below in 4-6 bullet points.
Keep it concise. No intro text.

TEXT:
${inputText}
`.trim()

        const out = await generateContent(prompt)
        setResults({ type: 'summary', content: out.trim() || '—' })
      } else {
        const prompt = `
Extract useful vocabulary from the text below (assume it's Spanish unless obvious otherwise).
Return ONLY valid JSON (no backticks, no commentary) in this exact shape:

{
  "items": [
    { "term": "SPANISH_WORD", "translation": "ENGLISH_TRANSLATION", "definition": "Short English definition / usage note" }
  ]
}

Rules:
- 6 to 10 items
- Prefer single words or short phrases
- Avoid duplicates
- Keep definition to 1 short sentence

TEXT:
${inputText}
`.trim()

        const out = await generateContent(prompt)
        const parsed = safeJsonParse(out)
        const items = clampItems(parsed?.items, 10)

        if (!items.length) {
          // fallback: show raw output so you can debug prompt behavior
          setResults({
            type: 'summary',
            content:
              'Could not parse vocab JSON. Here is the raw model output:\n\n' + out,
          })
        } else {
          // stable ids based on term
          const withIds = items.map((x, idx) => ({
            ...x,
            id: `term:${x.term.toLowerCase()}:${idx}`,
            category: 'AI Generated',
          }))
          setResults({ type: 'vocab', items: withIds })
        }
      }
    } catch (err) {
      console.error(err)
      setResults({
        type: 'summary',
        content: `Error: ${err?.message || 'AI request failed'}`,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveToBank = async (item) => {
    if (!user?.uid) {
      showToast('Sign in to save.')
      return
    }
    if (savedIDs.includes(item.id)) return

    try {
      await addDoc(
        collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank'),
        {
          term: item.term,              // Spanish
          definition: item.translation, // English (match Dashboard schema)
          category: 'AI Generated',
          createdAt: serverTimestamp(),
          mastery: 0,
        }
      )
      setSavedIDs((prev) => [...prev, item.id])
      showToast(`Saved “${item.term}”`)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Could not save word.')
    }
  }

  const handleSaveAll = async () => {
    const toSave = vocabItems.filter((i) => !savedIDs.includes(i.id))
    if (!toSave.length) return showToast('All saved already.')
    for (const item of toSave) {
      // eslint-disable-next-line no-await-in-loop
      await handleSaveToBank(item)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Copied')
    } catch {
      showToast('Copy failed')
    }
  }

  const resetAll = () => {
    setInputText('')
    setResults(null)
    setSavedIDs([])
    showToast('Reset')
  }

  const placeholder =
    activeTab === 'vocab'
      ? 'Paste Spanish text here… I’ll extract useful vocabulary.'
      : 'Paste a long text here… I’ll summarize it.'

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="pt-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              <Sparkles className="text-purple-400 fill-purple-400/20" size={30} />
              AI Studio
            </h1>
            <p className="text-slate-400">
              Extract vocabulary, summarize text, and save items to your Word Bank.
            </p>
          </div>

          {toast && (
            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm">
              {toast}
            </div>
          )}
        </div>

        {/* MODE SWITCH */}
        <div className="mt-6 bg-[#0f172a] p-1.5 rounded-2xl border border-white/10 flex relative max-w-xl">
          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${
              activeTab === 'vocab' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Brain size={16} /> Vocab
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${
              activeTab === 'summary' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText size={16} /> Summary
          </button>

          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl transition-all duration-300 ${
              activeTab === 'summary' ? 'left-[50%]' : 'left-1.5'
            }`}
          />
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: INPUT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-5 flex flex-col focus-within:border-purple-500/50 transition-colors relative overflow-hidden min-h-[420px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50" />

            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-white font-bold">
                  {activeTab === 'vocab' ? 'Vocab Extractor' : 'Summarizer'}
                </div>
                <div className="text-xs text-slate-500">
                  {inputWords} words • {inputChars} chars
                </div>
              </div>

              <button
                onClick={() => {
                  setInputText('')
                  showToast('Cleared')
                }}
                disabled={!inputText}
                className="text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-bold"
                title="Clear input"
              >
                <Trash2 size={16} /> Clear
              </button>
            </div>

            <textarea
              className="w-full flex-1 bg-transparent resize-none focus:outline-none text-slate-300 placeholder-slate-600 leading-relaxed"
              placeholder={placeholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                onClick={resetAll}
                className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-bold transition flex items-center gap-2"
              >
                <RotateCcw size={18} /> Reset
              </button>

              <button
                onClick={processAI}
                disabled={!canGenerate}
                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                {isProcessing ? 'Processing...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="lg:col-span-2">
          {!results && !isProcessing && (
            <div className="min-h-[420px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] text-center p-8">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {activeTab === 'summary' ? 'Ready to Summarize' : 'Ready to Extract'}
              </h3>
              <p className="text-slate-500 max-w-sm">
                Paste text on the left and hit <span className="text-slate-300 font-bold">Generate</span>.
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="min-h-[420px] flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-[#0f172a]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain size={24} className="text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-400 mt-6 font-medium animate-pulse">
                AI is analyzing your text...
              </p>
            </div>
          )}

          {results?.type === 'summary' && (
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-7 md:p-8 animate-in slide-in-from-bottom-4 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between gap-4 mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="text-purple-400" /> Output
                </h3>

                <button
                  onClick={() => copyToClipboard(results.content)}
                  className="text-slate-300 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <Copy size={16} /> Copy
                </button>
              </div>

              <pre className="whitespace-pre-wrap text-slate-300 leading-7 text-base">
                {results.content}
              </pre>
            </div>
          )}

          {results?.type === 'vocab' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-xl font-bold text-white">Detected Vocabulary</h3>
                  <p className="text-sm text-slate-500">
                    Saved {savedCount}/{vocabItems.length}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(vocabItems.map((i) => i.term).join('\n'))}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-bold transition flex items-center gap-2"
                  >
                    <Copy size={16} /> Copy list
                  </button>

                  <button
                    onClick={handleSaveAll}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold transition flex items-center gap-2 disabled:opacity-40"
                    disabled={!vocabItems.length || savedCount === vocabItems.length}
                  >
                    <Save size={16} /> Save all
                  </button>

                  <span className="text-xs font-bold bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                    {vocabItems.length} Items
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vocabItems.map((item) => {
                  const isSaved = savedIDs.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all duration-300 ${
                        isSaved
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-[#0f172a] border-white/10 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <div className="text-lg font-bold text-white truncate">{item.term}</div>
                          <div className="text-sm text-slate-400 truncate">{item.translation}</div>
                        </div>

                        <button
                          onClick={() => handleSaveToBank(item)}
                          disabled={isSaved}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                            isSaved
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                              : 'bg-slate-800 text-slate-400 hover:bg-purple-600 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                          }`}
                        >
                          {isSaved ? <Check size={20} /> : <Plus size={20} />}
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {item.definition || '—'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
