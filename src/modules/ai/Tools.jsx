// src/modules/ai/Tools.jsx
import React, { useMemo, useState } from 'react'
import {
  Sparkles, Brain, FileText, Check, Plus, Wand2, Copy, Loader2,
  RotateCcw, Trash2, Save, Crown, Lock, BookOpen, X
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { generateContent } from '../../lib/ai'
import { hasReachedLimit, FREEMIUM_LIMITS } from '../../lib/freemium'

// --- HELPERS ---
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

function clampItems(items, max = 10) {
  if (!Array.isArray(items)) return []
  return items.filter(Boolean).slice(0, max).map((x, idx) => {
      const term = String(x.term || x.word || '').trim()
      return {
        id: `term:${term.toLowerCase()}:${idx}`,
        term,
        translation: String(x.translation || x.english || '').trim(),
        definition: String(x.definition || x.note || '').trim(),
      }
    }).filter((x) => x.term)
}

export default function Tools({ 
user, 
words = [],
isPremium, 
dailyUsage, 
trackUsage, 
onUpgrade 
}) {
  const [activeTab, setActiveTab] = useState('vocab');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [savedIDs, setSavedIDs] = useState([]);
  const [toast, setToast] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  // ...existing code...
        } catch (err) {
          showToast('AI error');
        } finally {
          setIsProcessing(false);
        }
      };

    const categories = useMemo(() => {
      const cats = new Set(words.map(w => w.category || 'Uncategorized'));
      return ['Uncategorized', ...Array.from(cats).filter(c => c !== 'Uncategorized')].sort();
    }, [words]);

    const vocabItems = useMemo(() => clampItems(results?.items || []), [results]);
    const savedCount = useMemo(() => vocabItems.filter((i) => savedIDs.includes(i.id)).length, [vocabItems, savedIDs]);
    const inputWords = useMemo(() => inputText.trim().split(/\s+/).filter(Boolean).length, [inputText]);
    const inputChars = useMemo(() => inputText.length, [inputText]);
    const canGenerate = useMemo(() => !!inputText && !isProcessing && (!hasReachedLimit(dailyUsage, 'aiRequests', isPremium)), [inputText, isProcessing, dailyUsage, isPremium]);

    const showToast = (msg) => {
      setToast(msg);
      setTimeout(() => setToast(''), 2000);
    };

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied!');
      } catch {
        showToast('Failed to copy');
      }
    };

    const resetAll = () => {
      setInputText('');
      setResults(null);
      setSavedIDs([]);
      setToast('');
    };

    const processAI = async () => {
      if (!canGenerate) return;
      setIsProcessing(true);
      setResults(null);
      try {
        const aiResult = await generateContent(inputText, activeTab);
        setResults(aiResult);
        trackUsage && trackUsage('aiRequests');
      } catch (err) {
        showToast('AI error');
      } finally {
        setIsProcessing(false);
      }
    };

  const inputChars = inputText.length
  const inputWords = useMemo(() => {
    const t = inputText.trim()
    return t ? t.split(/\s+/).length : 0
  }, [inputText])

  const vocabItems = results?.type === 'vocab' ? results.items : []
  const savedCount = useMemo(() => vocabItems.filter((i) => savedIDs.includes(i.id)).length, [vocabItems, savedIDs])
  const canGenerate = !!inputText.trim() && !isProcessing

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1500)
  }

  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); showToast('Copied'); } 
    catch { showToast('Copy failed'); }
  }

  const resetAll = () => {
    setInputText('')
    setResults(null)
    setSavedIDs([])
    showToast('Reset')
  }

  // --- AI LOGIC WITH LIMITS ---
  const processAI = async () => {
    if (!inputText.trim()) return

    if (hasReachedLimit(dailyUsage, 'aiRequests', isPremium)) {
      setShowPaywall(true)
      return
    }

    setIsProcessing(true)
    setResults(null)

    try {
      if (activeTab === 'summary') {
        const prompt = `Summarize this in 4-6 bullet points. Concise. No intro.\n\nTEXT:\n${inputText}`
        const out = await generateContent(prompt)
        setResults({ type: 'summary', content: out.trim() || '—' })
      } else if (activeTab === 'breakdown') {
        const prompt = `Analyze this Spanish sentence in detail. Return JSON with:
- sentence: the original sentence
- translation: English translation
- parts: array of {word, partOfSpeech, translation, notes (e.g., reflexive verb, comparative adjective, preterite tense, etc.)}
- phrases: array of {phrase, meaning, grammar_notes}

Be specific about grammar forms. Format:
{ "sentence": "...", "translation": "...", "parts": [...], "phrases": [...] }

SENTENCE: ${inputText}`
        const out = await generateContent(prompt)
        const parsed = extractJson(out)
        if (parsed && parsed.sentence) {
          setResults({ type: 'breakdown', data: parsed })
        } else {
          setResults({ type: 'summary', content: 'Could not parse sentence breakdown.\n' + out })
        }
      } else {
        const prompt = `Return ONLY raw JSON. Extract 6-10 Spanish vocab words from this text.\nJSON Format: { "items": [{ "term": "...", "translation": "...", "definition": "..." }] }\n\nTEXT:\n${inputText}`
        const out = await generateContent(prompt)
        const parsed = extractJson(out)
        const items = clampItems(parsed?.items, 10)
        
        if (!items.length) setResults({ type: 'summary', content: 'Could not parse vocab JSON.\n' + out })
        else setResults({ type: 'vocab', items })
      }

      trackUsage('aiRequests')

    } catch (err) {
      console.error(err)
      setResults({ type: 'summary', content: `Error: ${err?.message || 'AI request failed'}` })
    } finally {
      setIsProcessing(false)
    }
  }

  // --- SAVE LOGIC ---
  const handleSaveToBank = async (item, category = 'AI Generated') => {
    if (!user?.uid) return showToast('Sign in to save.')
    if (savedIDs.includes(item.id)) return

    try {
      await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank'), {
        term: item.term,
        translation: item.translation || '',
        definition: item.definition || item.meaning || '',
        category: category,
        createdAt: serverTimestamp(),
        mastery: 0,
      })
      setSavedIDs((prev) => [...prev, item.id])
      showToast(`Saved to ${category}`)
    } catch (error) {
      console.error('Error saving:', error)
      showToast('Could not save')
    }
  }

  const handleSaveClick = (item) => {
    setPendingItem(item)
    setShowFolderModal(true)
  }

  const handleSaveAll = async () => {
    const toSave = vocabItems.filter((i) => !savedIDs.includes(i.id))
    if (!toSave.length) return showToast('All saved already.')
    setPendingItem(null)
    setShowFolderModal(true)
  }

  const placeholder = activeTab === 'vocab' ? 'Paste Spanish text here… I\'ll extract useful vocabulary.' 
    : activeTab === 'breakdown' ? 'Paste a Spanish sentence here… I\'ll break down every word and phrase.'
    : 'Paste a long text here… I\'ll summarize it.'

  const renderLimit = () => {
    if (isPremium) return <span className="text-amber-400 text-xs font-bold flex items-center gap-1"><Crown size={12}/> UNLIMITED</span>
    const count = dailyUsage?.aiRequests || 0
    const limit = FREEMIUM_LIMITS.aiRequests
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-[#0f172a] px-3 py-1 rounded-full border border-slate-700">
        <Sparkles size={12} className={count >= limit ? "text-red-400" : "text-purple-400"} />
        <span>{count} / {limit} Free Uses</span>
      </div>
    )
  }

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
            <p className="text-slate-400">Extract vocabulary, analyze sentences, summarize text, and save to your Word Bank.</p>
          </div>
          {toast && <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm">{toast}</div>}
        </div>

        {/* MODE SWITCH */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="bg-[#0f172a] p-1.5 rounded-2xl border border-white/10 flex relative w-full md:w-auto overflow-x-auto">
            <button onClick={() => setActiveTab('vocab')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 whitespace-nowrap ${activeTab === 'vocab' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <Brain size={16} /> Vocab
            </button>
            <button onClick={() => setActiveTab('breakdown')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 whitespace-nowrap ${activeTab === 'breakdown' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <BookOpen size={16} /> Breakdown
            </button>
            <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 whitespace-nowrap ${activeTab === 'summary' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <FileText size={16} /> Summary
            </button>
            <div className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl transition-all duration-300 pointer-events-none`} style={{
              width: 'calc(calc(100% / 3) - 6px)',
              left: activeTab === 'breakdown' ? 'calc(calc(100% / 3) + 3px)' : activeTab === 'summary' ? 'calc(calc(200% / 3) + 3px)' : '3px'
            }} />
          </div>
          
          {renderLimit()}
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
                <div className="text-white font-bold">{activeTab === 'vocab' ? 'Vocab Extractor' : activeTab === 'breakdown' ? 'Sentence Analyzer' : 'Summarizer'}</div>
                <div className="text-xs text-slate-500">{inputWords} words • {inputChars} chars</div>
              </div>
              <button onClick={() => { setInputText(''); showToast('Cleared') }} disabled={!inputText} className="text-slate-400 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-2 text-sm font-bold">
                <Trash2 size={16} /> Clear
              </button>
            </div>
            <textarea className="w-full flex-1 bg-transparent resize-none focus:outline-none text-slate-300 placeholder-slate-600 leading-relaxed" placeholder={placeholder} value={inputText} onChange={(e) => setInputText(e.target.value)} />
            <div className="mt-4 flex items-center justify-between gap-3">
              <button onClick={resetAll} className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-bold transition flex items-center gap-2">
                <RotateCcw size={18} /> Reset
              </button>
              
              {/* GENERATE BUTTON */}
              <button 
                onClick={processAI} 
                disabled={!canGenerate} 
                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (hasReachedLimit(dailyUsage, 'aiRequests', isPremium) ? <Lock size={20} className="text-red-600" /> : <Wand2 size={20} />)}
                {isProcessing ? 'Processing...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="lg:col-span-2">
          {!results && !isProcessing && (
            <div className="min-h-[420px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] text-center p-8">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600"><Sparkles size={32} /></div>
              <h3 className="text-xl font-bold text-white mb-2">{activeTab === 'summary' ? 'Ready to Summarize' : activeTab === 'breakdown' ? 'Ready to Analyze' : 'Ready to Extract'}</h3>
              <p className="text-slate-500 max-w-sm">Paste text on the left and hit <span className="text-slate-300 font-bold">Generate</span>.</p>
            </div>
          )}

          {isProcessing && (
            <div className="min-h-[420px] flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-[#0f172a]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center"><Brain size={24} className="text-purple-400 animate-pulse" /></div>
              </div>
              <p className="text-slate-400 mt-6 font-medium animate-pulse">AI is analyzing your text...</p>
            </div>
          )}

          {results?.type === 'summary' && (
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-7 md:p-8 animate-in slide-in-from-bottom-4 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4 mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="text-purple-400" /> Output</h3>
                <button onClick={() => copyToClipboard(results.content)} className="text-slate-300 hover:text-white text-sm font-bold flex items-center gap-2"><Copy size={16} /> Copy</button>
              </div>
              <pre className="whitespace-pre-wrap text-slate-300 leading-7 text-base">{results.content}</pre>
            </div>
          )}

          {results?.type === 'breakdown' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              {/* Sentence Header */}
              <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-2">Spanish Sentence</div>
                  <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed mb-6">{results.data?.sentence}</p>
                  
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">English Translation</div>
                  <p className="text-lg text-slate-300">{results.data?.translation}</p>
                </div>
              </div>

              {/* Word Breakdown */}
              {results.data?.parts && results.data.parts.length > 0 && (
                <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Brain size={20} /> Word-by-Word Breakdown</h3>
                  <div className="space-y-3">
                    {results.data.parts.map((part, idx) => (
                      <div key={idx} className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-4 hover:border-indigo-500/40 transition-colors">
                        <div className="flex flex-wrap gap-4 items-start">
                          <div className="flex-1 min-w-[120px]">
                            <div className="text-lg font-bold text-white">{part.word}</div>
                            <div className="text-sm text-slate-400 mt-1">{part.translation}</div>
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <div className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-2">Part of Speech</div>
                            <div className="text-sm text-slate-300 font-medium">{part.partOfSpeech}</div>
                          </div>
                          {part.notes && (
                            <div className="flex-1 min-w-[150px]">
                              <div className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-2">Notes</div>
                              <div className="text-sm text-slate-300">{part.notes}</div>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button 
                            onClick={() => handleSaveClick(part)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/40 transition-colors font-medium flex items-center gap-1"
                          >
                            <Plus size={14} /> Add to Bank
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phrase Breakdown */}
              {results.data?.phrases && results.data.phrases.length > 0 && (
                <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><BookOpen size={20} /> Phrase Explanations</h3>
                  <div className="space-y-3">
                    {results.data.phrases.map((phrase, idx) => (
                      <div key={idx} className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-4">
                        <div className="text-white font-bold mb-1">{phrase.phrase}</div>
                        <div className="text-slate-400 text-sm mb-2">{phrase.meaning}</div>
                        <div className="text-xs text-slate-500 leading-relaxed">{phrase.grammar_notes}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {results?.type === 'vocab' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-xl font-bold text-white">Detected Vocabulary</h3>
                  <p className="text-sm text-slate-500">Saved {savedCount}/{vocabItems.length}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyToClipboard(vocabItems.map((i) => i.term).join('\n'))} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-bold flex items-center gap-2"><Copy size={16} /> Copy list</button>
                  <button onClick={handleSaveAll} className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold flex items-center gap-2 disabled:opacity-40" disabled={!vocabItems.length || savedCount === vocabItems.length}><Save size={16} /> Save all</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vocabItems.map((item) => {
                  const isSaved = savedIDs.includes(item.id)
                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border transition-all ${isSaved ? 'bg-green-500/10 border-green-500/30' : 'bg-[#0f172a] border-white/10 hover:border-purple-500/40'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <div className="text-lg font-bold text-white truncate">{item.term}</div>
                          <div className="text-sm text-slate-400 truncate">{item.translation}</div>
                        </div>
                        <button onClick={() => !isSaved && handleSaveClick(item)} disabled={isSaved} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isSaved ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-purple-600 hover:text-white'}`}>
                          {isSaved ? <Check size={20} /> : <Plus size={20} />}
                        </button>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5"><p className="text-xs text-slate-500 leading-relaxed">{item.definition || '—'}</p></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOLDER SELECTION MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <BookOpen size={24} /> Choose Folder
              </h2>
              <button onClick={() => { setShowFolderModal(false); setPendingItem(null); }} className="text-white hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Folder List */}
            <div className="p-6 space-y-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    if (pendingItem) {
                      handleSaveToBank(pendingItem, category);
                    } else {
                      // Save all case
                      const toSave = vocabItems.filter((i) => !savedIDs.includes(i.id));
                      toSave.forEach(item => handleSaveToBank(item, category));
                    }
                    setShowFolderModal(false);
                    setPendingItem(null);
                  }}
                  className="w-full px-6 py-3 rounded-2xl bg-[#1e293b] border border-white/10 hover:border-purple-500/50 hover:bg-[#263345] text-left font-semibold text-white transition-all flex items-center gap-3 group"
                >
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 group-hover:scale-150 transition-transform" />
                  <div className="flex-1">{category}</div>
                  <Plus size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                </button>
              ))}
              
              {/* New Folder Button */}
              <button
                onClick={() => {
                  const newFolder = prompt('Enter new folder name:');
                  if (newFolder?.trim()) {
                    if (pendingItem) {
                      handleSaveToBank(pendingItem, newFolder.trim());
                    } else {
                      const toSave = vocabItems.filter((i) => !savedIDs.includes(i.id));
                      toSave.forEach(item => handleSaveToBank(item, newFolder.trim()));
                    }
                    setShowFolderModal(false);
                    setPendingItem(null);
                  }
                }}
                className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/30 text-left font-semibold text-purple-300 transition-all flex items-center gap-3 group mt-4"
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                <div className="flex-1">+ Create New Folder</div>
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYWALL MODAL */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] border border-amber-500/50 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-600" />
            <Crown size={48} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-slate-400 mb-6">
              You've used your 3 free AI requests for today. Upgrade to Premium for unlimited summaries and vocabulary extraction.
            </p>
            <button 
              onClick={() => { setShowPaywall(false); onUpgrade(); }} 
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl mb-3 hover:scale-[1.02] transition-transform"
            >
              Upgrade for £9.99
            </button>
            <button onClick={() => setShowPaywall(false)} className="text-slate-500 hover:text-white text-sm">No thanks</button>
          </div>
        </div>
      )}
    </div>
    );
}


  const placeholder = activeTab === 'vocab' ? 'Paste Spanish text here… I’ll extract useful vocabulary.' : 'Paste a long text here… I’ll summarize it.'

  // Helper to render usage bar
  const renderLimit = () => {
    if (isPremium) return <span className="text-amber-400 text-xs font-bold flex items-center gap-1"><Crown size={12}/> UNLIMITED</span>
    const count = dailyUsage?.aiRequests || 0
    const limit = FREEMIUM_LIMITS.aiRequests
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-[#0f172a] px-3 py-1 rounded-full border border-slate-700">
        <Sparkles size={12} className={count >= limit ? "text-red-400" : "text-purple-400"} />
        <span>{count} / {limit} Free Uses</span>
      </div>
    )
  }

  const handleSaveToBank = async (item) => {
    if (!user?.uid) return showToast('Sign in to save.')
    if (savedIDs.includes(item.id)) return

    try {
      await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank'), {
        term: item.term,
        definition: item.translation || item.definition || '',
        category: 'AI Generated',
        createdAt: serverTimestamp(),
        mastery: 0,
      })
      setSavedIDs((prev) => [...prev, item.id])
      showToast(`Saved “${item.term}”`)
    } catch (error) {
      console.error('Error saving:', error)
      showToast('Could not save')
    }
  }

  const handleSaveAll = async () => {
    const toSave = vocabItems.filter((i) => !savedIDs.includes(i.id))
    if (!toSave.length) return showToast('All saved already.')
    for (const item of toSave) await handleSaveToBank(item)
  }

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
            <p className="text-slate-400">Extract vocabulary, summarize text, and save items to your Word Bank.</p>
          </div>
          {toast && <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm">{toast}</div>}
        </div>
        {/* MODE SWITCH */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="bg-[#0f172a] p-1.5 rounded-2xl border border-white/10 flex relative w-full md:w-auto min-w-[300px]">
            <button onClick={() => setActiveTab('vocab')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${activeTab === 'vocab' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <Brain size={16} /> Vocab
            </button>
            <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${activeTab === 'summary' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <FileText size={16} /> Summary
            </button>
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl transition-all duration-300 ${activeTab === 'summary' ? 'left-[50%]' : 'left-1.5'}`} />
          </div>
          
          {/* USAGE INDICATOR */}
          {renderLimit()}
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
                <div className="text-white font-bold">{activeTab === 'vocab' ? 'Vocab Extractor' : 'Summarizer'}</div>
                <div className="text-xs text-slate-500">{inputWords} words • {inputChars} chars</div>
              </div>
              <button onClick={() => { setInputText(''); showToast('Cleared') }} disabled={!inputText} className="text-slate-400 hover:text-white disabled:opacity-40 transition-colors flex items-center gap-2 text-sm font-bold">
                <Trash2 size={16} /> Clear
              </button>
            </div>
            <textarea className="w-full flex-1 bg-transparent resize-none focus:outline-none text-slate-300 placeholder-slate-600 leading-relaxed" placeholder={placeholder} value={inputText} onChange={(e) => setInputText(e.target.value)} />
            <div className="mt-4 flex items-center justify-between gap-3">
              <button onClick={resetAll} className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-bold transition flex items-center gap-2">
                <RotateCcw size={18} /> Reset
              </button>
              
              {/* GENERATE BUTTON */}
              <button 
                onClick={processAI} 
                disabled={!canGenerate} 
                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (hasReachedLimit(dailyUsage, 'aiRequests', isPremium) ? <Lock size={20} className="text-red-600" /> : <Wand2 size={20} />)}
                {isProcessing ? 'Processing...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="lg:col-span-2">
          {!results && !isProcessing && (
            <div className="min-h-[420px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] text-center p-8">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600"><Sparkles size={32} /></div>
              <h3 className="text-xl font-bold text-white mb-2">{activeTab === 'summary' ? 'Ready to Summarize' : 'Ready to Extract'}</h3>
              <p className="text-slate-500 max-w-sm">Paste text on the left and hit <span className="text-slate-300 font-bold">Generate</span>.</p>
            </div>
          )}

          {isProcessing && (
            <div className="min-h-[420px] flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-[#0f172a]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center"><Brain size={24} className="text-purple-400 animate-pulse" /></div>
              </div>
              <p className="text-slate-400 mt-6 font-medium animate-pulse">AI is analyzing your text...</p>
            </div>
          )}

          {results?.type === 'summary' && (
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-7 md:p-8 animate-in slide-in-from-bottom-4 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4 mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="text-purple-400" /> Output</h3>
                <button onClick={() => copyToClipboard(results.content)} className="text-slate-300 hover:text-white text-sm font-bold flex items-center gap-2"><Copy size={16} /> Copy</button>
              </div>
              <pre className="whitespace-pre-wrap text-slate-300 leading-7 text-base">{results.content}</pre>
            </div>
          )}

          {results?.type === 'vocab' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-xl font-bold text-white">Detected Vocabulary</h3>
                  <p className="text-sm text-slate-500">Saved {savedCount}/{vocabItems.length}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyToClipboard(vocabItems.map((i) => i.term).join('\n'))} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-bold flex items-center gap-2"><Copy size={16} /> Copy list</button>
                  <button onClick={handleSaveAll} className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold flex items-center gap-2 disabled:opacity-40" disabled={!vocabItems.length || savedCount === vocabItems.length}><Save size={16} /> Save all</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vocabItems.map((item) => {
                  const isSaved = savedIDs.includes(item.id)
                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border transition-all ${isSaved ? 'bg-green-500/10 border-green-500/30' : 'bg-[#0f172a] border-white/10 hover:border-purple-500/40'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <div className="text-lg font-bold text-white truncate">{item.term}</div>
                          <div className="text-sm text-slate-400 truncate">{item.translation}</div>
                        </div>
                        <button onClick={() => handleSaveToBank(item)} disabled={isSaved} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isSaved ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-purple-600 hover:text-white'}`}>
                          {isSaved ? <Check size={20} /> : <Plus size={20} />}
                        </button>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5"><p className="text-xs text-slate-500 leading-relaxed">{item.definition || '—'}</p></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAYWALL MODAL */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] border border-amber-500/50 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-600" />
            <Crown size={48} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-slate-400 mb-6">
              You've used your 3 free AI requests for today. Upgrade to Premium for unlimited summaries and vocabulary extraction.
            </p>
            <button 
              onClick={() => { setShowPaywall(false); onUpgrade(); }} 
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl mb-3 hover:scale-[1.02] transition-transform"
            >
              Upgrade for £9.99
            </button>
            <button onClick={() => setShowPaywall(false)} className="text-slate-500 hover:text-white text-sm">No thanks</button>
          </div>
        </div>
      )}
    </div>
  )
