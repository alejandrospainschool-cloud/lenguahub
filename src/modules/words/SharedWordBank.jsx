// src/modules/words/SharedWordBank.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { fetchWordInfo } from '../../lib/linguaRobot'
import {
  Plus, Search, Folder, ArrowLeft, MoreHorizontal, Trash2, Edit2,
  FolderPlus, X, BookOpen, Languages, MessageSquareText, Loader2,
} from 'lucide-react'
import {
  addDoc, collection, serverTimestamp, doc, deleteDoc, updateDoc,
  onSnapshot, query,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

// ─── Constants ──────────────────────────────────────────────────────────────
const FOLDER_COLORS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Slate', hex: '#64748b' },
]

const POS_STYLES = {
  verb:         { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
  noun:         { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  adjective:    { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
  adverb:       { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  pronoun:      { bg: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'border-pink-500/20' },
  preposition:  { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20' },
  conjunction:  { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/20' },
  interjection: { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
  phrase:       { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
  default:      { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20' },
}

function getPosStyle(pos) {
  return POS_STYLES[pos?.toLowerCase()] || POS_STYLES.default
}

// ─── Small UI Components ────────────────────────────────────────────────────

function PosBadge({ pos }) {
  if (!pos || pos === 'unknown') return null
  const s = getPosStyle(pos)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
      {pos}
    </span>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            active === t.id
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Conjugation Table ──────────────────────────────────────────────────────

function ConjugationTable({ conjugations }) {
  const tenses = Object.keys(conjugations || {})
  const [active, setActive] = useState(tenses[0] || '')

  if (!tenses.length) return <p className="text-slate-500 text-sm">No conjugation data available.</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tenses.map(t => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              active === t
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {active && conjugations[active] && (
        <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Person</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Form</th>
              </tr>
            </thead>
            <tbody>
              {conjugations[active].map((row, i) => (
                <tr key={i} className="border-b border-white/[.03] last:border-0 hover:bg-white/[.02] transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-400 font-medium">{row.person}</td>
                  <td className="px-5 py-3 text-sm text-white font-bold">{row.form}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Word Detail Modal ──────────────────────────────────────────────────────

function WordDetailModal({ word, onClose, onEnrich }) {
  const [tab, setTab] = useState('overview')
  const [enriching, setEnriching] = useState(false)
  const [localEnrichment, setLocalEnrichment] = useState(word.enrichment || null)
  const [enrichError, setEnrichError] = useState(null)
  const enrichAttempted = useRef(false)

  // Keep local enrichment in sync if parent prop updates
  useEffect(() => {
    if (word.enrichment) setLocalEnrichment(word.enrichment)
  }, [word.enrichment])

  const entry = localEnrichment?.entries?.[0]
  const hasConj = entry?.conjugations && Object.keys(entry.conjugations).length > 0
  const hasExamples = entry?.tenseExamples?.length > 0 || entry?.definitions?.some(d => d.examples?.length > 0)

  // Auto-fetch enrichment if missing (runs once per modal open)
  useEffect(() => {
    if (localEnrichment || enrichAttempted.current) return
    if (!word.term) return
    enrichAttempted.current = true
    let cancelled = false

    const doEnrich = async () => {
      setEnriching(true)
      setEnrichError(null)
      try {
        const data = await fetchWordInfo(word.term)
        if (cancelled) return
        if (data?.entries) {
          setLocalEnrichment(data)
          onEnrich(word.id, data)
        } else {
          setEnrichError('No data returned')
        }
      } catch (err) {
        console.error('Auto-enrich failed:', err)
        if (!cancelled) setEnrichError(err.message || 'Lookup failed')
      } finally {
        if (!cancelled) setEnriching(false)
      }
    }

    doEnrich()
    return () => { cancelled = true }
  }, [word.id, word.term]) // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BookOpen size={14} /> },
    ...(hasConj ? [{ id: 'conjugations', label: 'Conjugations', icon: <Languages size={14} /> }] : []),
    ...(hasExamples ? [{ id: 'examples', label: 'Examples', icon: <MessageSquareText size={14} /> }] : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0b1120] border border-white/10 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-white/5 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0"
              style={{ backgroundColor: `${word.folderColor || '#3b82f6'}15`, color: word.folderColor || '#3b82f6' }}
            >
              {word.term?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{word.term}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {entry && <PosBadge pos={entry.partOfSpeech} />}
                {entry?.gender && (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {entry.article && <span className="text-slate-400 mr-1">{entry.article}</span>}
                    {entry.gender}
                  </span>
                )}
                {entry?.isIrregular && (
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">irregular</span>
                )}
              </div>
            </div>
          </div>

          {tabs.length > 1 && (
            <div className="mt-4">
              <TabBar tabs={tabs} active={tab} onChange={setTab} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Loading state */}
          {enriching && (
            <div className="flex flex-col items-center gap-3 text-slate-400 py-12">
              <Loader2 size={24} className="animate-spin text-blue-400" />
              <span className="text-sm">Looking up word information...</span>
            </div>
          )}

          {/* No data fallback */}
          {!enriching && !entry && (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-slate-600" />
              </div>
              {enrichError && <p className="text-amber-400 text-sm mb-2">Could not look up this word: {enrichError}</p>}
              <p className="text-slate-400 text-sm mb-1">{word.primaryDefinition || word.definition || word.translation || ''}</p>
              <p className="text-slate-600 text-xs">Detailed information unavailable</p>
              <button
                onClick={() => { enrichAttempted.current = false; setLocalEnrichment(null); setEnrichError(null) }}
                className="mt-3 text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors"
              >
                Retry Lookup
              </button>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {!enriching && entry && tab === 'overview' && (
            <div className="space-y-6">
              {/* Definitions */}
              {entry.definitions?.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Definitions</h3>
                  <div className="space-y-3">
                    {entry.definitions.map((def, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="text-blue-500 font-bold text-sm mt-0.5 shrink-0 w-5 text-right">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-sm leading-relaxed">{def.text}</p>
                          {def.examples?.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {def.examples.map((ex, j) => (
                                <div key={j} className="pl-3 border-l-2 border-blue-500/20">
                                  <p className="text-slate-300 text-xs italic">{ex.spanish || ex}</p>
                                  {ex.english && <p className="text-slate-500 text-xs">{ex.english}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Synonyms */}
              {entry.synonyms?.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Synonyms</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.synonyms.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-800/60 border border-white/5 rounded-lg text-sm text-slate-300">{s}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Antonyms */}
              {entry.antonyms?.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Antonyms</h3>
                  <div className="flex flex-wrap gap-2">
                    {entry.antonyms.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 bg-red-500/5 border border-red-500/10 rounded-lg text-sm text-red-300">{a}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Custom note */}
              {word.customNote && (
                <section>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Note</h3>
                  <p className="text-slate-400 text-sm bg-slate-800/30 rounded-xl p-3 border border-white/5">{word.customNote}</p>
                </section>
              )}
            </div>
          )}

          {/* CONJUGATIONS TAB */}
          {!enriching && entry && tab === 'conjugations' && hasConj && (
            <ConjugationTable conjugations={entry.conjugations} />
          )}

          {/* EXAMPLES TAB */}
          {!enriching && entry && tab === 'examples' && (
            <div className="space-y-4">
              {/* Tense examples */}
              {entry.tenseExamples?.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Usage by Tense</h3>
                  <div className="space-y-3">
                    {entry.tenseExamples.map((ex, i) => (
                      <div key={i} className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{ex.tense}</span>
                        <p className="text-slate-200 text-sm mt-1 leading-relaxed">{ex.spanish}</p>
                        <p className="text-slate-500 text-xs mt-1">{ex.english}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Definition examples */}
              {entry.definitions?.some(d => d.examples?.length > 0) && (
                <section>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">More Examples</h3>
                  <div className="space-y-2">
                    {entry.definitions.flatMap((def, i) =>
                      (def.examples || []).map((ex, j) => (
                        <div key={`${i}-${j}`} className="flex gap-3 items-start bg-slate-800/20 rounded-xl p-3 border border-white/[.03]">
                          <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                          <div className="min-w-0">
                            <p className="text-slate-200 text-sm leading-relaxed">{ex.spanish || ex}</p>
                            {ex.english && <p className="text-slate-500 text-xs mt-0.5">{ex.english}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add Word Modal ─────────────────────────────────────────────────────────

function AddWordModal({ folders, currentFolder, onClose, targetUid, isTeacherView }) {
  const [term, setTerm] = useState('')
  const [lookup, setLookup] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState(currentFolder?.name || '')
  const [customNote, setCustomNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleLookup = useCallback(async () => {
    const w = term.trim()
    if (!w) return
    setLookup({ loading: true, data: null, error: null })
    try {
      const data = await fetchWordInfo(w)
      setLookup({ loading: false, data, error: null })
    } catch (err) {
      setLookup({ loading: false, data: null, error: err.message })
    }
  }, [term])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleLookup() }
  }

  const handleCreateFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    setSelectedFolder(name)
    setShowNewFolder(false)
  }

  const handleSave = async () => {
    const w = term.trim()
    if (!w || !selectedFolder) return
    setSaving(true)
    try {
      const enrichment = lookup?.data || null
      const entry = enrichment?.entries?.[0]
      const primaryDef = entry?.definitions?.[0]?.text || customNote || ''
      const folderColor = folders.find(f => f.name === selectedFolder)?.color || newFolderColor.hex

      await addDoc(
        collection(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'wordbank'),
        {
          term: w.toLowerCase(),
          primaryDefinition: primaryDef,
          partOfSpeech: entry?.partOfSpeech || '',
          category: selectedFolder,
          folderColor,
          createdAt: serverTimestamp(),
          mastery: 0,
          createdBy: isTeacherView ? 'tutor' : 'student',
          customNote: customNote || '',
          enrichment,
        }
      )
      onClose()
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const entry = lookup?.data?.entries?.[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-[#0b1120] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-black text-white">Add Word</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Word Input */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Spanish Word</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={term}
                onChange={e => setTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. hablar, casa, rápido..."
                className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <button
                onClick={handleLookup}
                disabled={!term.trim() || lookup?.loading}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shrink-0"
              >
                {lookup?.loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                <span className="hidden sm:inline">Look Up</span>
              </button>
            </div>
          </div>

          {/* Loading */}
          {lookup?.loading && (
            <div className="flex items-center gap-3 text-slate-400 py-4 justify-center bg-slate-900/40 rounded-2xl border border-white/5">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Looking up &ldquo;{term.trim()}&rdquo;...</span>
            </div>
          )}

          {/* Error */}
          {lookup?.error && !lookup?.loading && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-300 text-sm">Could not look up this word. You can still save it manually.</p>
            </div>
          )}

          {/* Preview */}
          {entry && !lookup?.loading && (
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <PosBadge pos={entry.partOfSpeech} />
                {entry.gender && <span className="text-[10px] text-slate-500 font-bold uppercase">{entry.article} · {entry.gender}</span>}
                {entry.isIrregular && <span className="text-[10px] text-orange-400 font-bold uppercase">irregular</span>}
                {lookup?.data?.success && <span className="text-[10px] text-emerald-500 font-bold ml-auto">✓ Found</span>}
              </div>
              {entry.definitions?.[0] && (
                <p className="text-slate-200 text-sm leading-relaxed">{entry.definitions[0].text}</p>
              )}
              {entry.definitions?.length > 1 && (
                <p className="text-slate-500 text-xs">+ {entry.definitions.length - 1} more definition{entry.definitions.length > 2 ? 's' : ''}</p>
              )}
              {entry.conjugations && <p className="text-blue-400 text-xs font-medium">✓ Conjugation data available</p>}
              {entry.tenseExamples?.length > 0 && <p className="text-blue-400 text-xs font-medium">✓ {entry.tenseExamples.length} tense examples</p>}
            </div>
          )}

          {/* Teacher Note */}
          {isTeacherView && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Teacher Note (optional)</label>
              <input
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Add a note for the student..."
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          )}

          {/* Folder */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Collection</label>
            {!showNewFolder ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {folders.map(f => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setSelectedFolder(f.name)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${
                        selectedFolder === f.name
                          ? 'bg-blue-600/10 border-blue-500/30 text-white ring-1 ring-blue-500/20'
                          : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.color }} />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewFolder(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-white/10 text-slate-500 text-sm hover:text-white hover:border-white/20 transition-all"
                >
                  <FolderPlus size={14} /> New Collection
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 space-y-3">
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                  placeholder="Collection name..."
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
                <div className="flex gap-2 flex-wrap">
                  {FOLDER_COLORS.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        newFolderColor.name === c.name ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-lg transition-all">Create</button>
                  <button onClick={() => setShowNewFolder(false)} className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-white transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-white/5 shrink-0">
          <button
            onClick={handleSave}
            disabled={!term.trim() || !selectedFolder || saving}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[.98]"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Plus size={16} /> Save Word</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Word Modal ────────────────────────────────────────────────────────

function EditWordModal({ word, folders, onClose, targetUid }) {
  const [term, setTerm] = useState(word.term || '')
  const [selectedFolder, setSelectedFolder] = useState(word.category || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const w = term.trim()
    if (!w || !selectedFolder) return
    setSaving(true)
    try {
      const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'wordbank', word.id)
      const folderColor = folders.find(f => f.name === selectedFolder)?.color || word.folderColor

      let enrichment = word.enrichment
      let primaryDef = word.primaryDefinition
      let pos = word.partOfSpeech

      // Re-enrich if term changed
      if (w.toLowerCase() !== word.term?.toLowerCase()) {
        try {
          const data = await fetchWordInfo(w)
          if (data?.entries) {
            enrichment = data
            primaryDef = data.entries[0]?.definitions?.[0]?.text || ''
            pos = data.entries[0]?.partOfSpeech || ''
          }
        } catch { /* keep existing enrichment */ }
      }

      await updateDoc(ref, {
        term: w.toLowerCase(),
        category: selectedFolder,
        folderColor,
        enrichment,
        primaryDefinition: primaryDef,
        partOfSpeech: pos,
      })
      onClose()
    } catch (err) {
      console.error('Edit error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-[#0b1120] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">Edit Word</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Term</label>
            <input
              value={term}
              onChange={e => setTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Collection</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {folders.map(f => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setSelectedFolder(f.name)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${
                    selectedFolder === f.name
                      ? 'bg-blue-600/10 border-blue-500/30 text-white ring-1 ring-blue-500/20'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.color }} />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!term.trim() || !selectedFolder || saving}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[.98]"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main WordBank Component ────────────────────────────────────────────────

export default function WordBank({
  user,
  words: initialWords = [],
  studentUid,
  isTeacherView = false,
  onBack = null,
  // Freemium props (passed through from parent)
  trackUsage,
}) {
  const [loadedWords, setLoadedWords] = useState(initialWords)
  const [currentFolder, setCurrentFolder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)
  const [selectedWordId, setSelectedWordId] = useState(null)
  const [modalMode, setModalMode] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const targetUid = studentUid || user?.uid

  // ─── Load words from Firestore ──────────────────────────────────────────
  useEffect(() => {
    if (!targetUid) return
    const q = query(collection(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'wordbank'))
    const unsub = onSnapshot(q, snap => {
      setLoadedWords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [targetUid])

  const words = loadedWords

  // Derive selectedWord from the live words array so it's always fresh
  const selectedWord = useMemo(
    () => (selectedWordId ? words.find(w => w.id === selectedWordId) || null : null),
    [selectedWordId, words]
  )

  // ─── Folders ────────────────────────────────────────────────────────────
  const folders = useMemo(() => {
    const map = new Map()
    words.forEach(w => {
      const cat = w.category || 'Uncategorized'
      if (!map.has(cat)) map.set(cat, { name: cat, color: w.folderColor || '#3b82f6', count: 0 })
      map.get(cat).count++
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [words])

  // ─── Visible words ─────────────────────────────────────────────────────
  const visibleWords = useMemo(() => {
    return words
      .filter(w => {
        const q = searchTerm.toLowerCase()
        const matchesSearch = q
          ? (w.term || '').toLowerCase().includes(q) ||
            (w.primaryDefinition || '').toLowerCase().includes(q) ||
            (w.definition || '').toLowerCase().includes(q)
          : true
        const matchesFolder = currentFolder ? w.category === currentFolder.name : true
        return searchTerm ? matchesSearch : matchesFolder
      })
      .sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
        return bTime - aTime
      })
  }, [words, searchTerm, currentFolder])

  // ─── Enrich a word ─────────────────────────────────────────────────────
  const handleEnrichWord = useCallback(async (wordId, enrichmentData) => {
    if (!targetUid || !wordId) return
    try {
      const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'wordbank', wordId)
      const entry = enrichmentData.entries?.[0]
      await updateDoc(ref, {
        enrichment: enrichmentData,
        primaryDefinition: entry?.definitions?.[0]?.text || '',
        partOfSpeech: entry?.partOfSpeech || '',
      })
    } catch (err) {
      console.error('Enrich update failed:', err)
    }
  }, [targetUid])

  // ─── Actions ───────────────────────────────────────────────────────────
  const handleDeleteWord = async (id) => {
    if (!window.confirm('Delete this word?')) return
    try {
      await deleteDoc(doc(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'wordbank', id))
    } catch (err) { console.error(err) }
  }

  const openAddWord = () => {
    if (trackUsage) trackUsage('wordsAdded')
    setModalMode('add_word')
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto min-h-[60vh] flex flex-col pb-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          {(currentFolder || onBack) && (
            <button
              onClick={() => currentFolder ? setCurrentFolder(null) : onBack?.()}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
              {searchTerm
                ? 'Search Results'
                : currentFolder?.name || (isTeacherView ? 'Student Word Bank' : 'My Collections')}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {currentFolder
                ? `${visibleWords.length} word${visibleWords.length !== 1 ? 's' : ''}`
                : `${folders.length} collection${folders.length !== 1 ? 's' : ''} · ${words.length} word${words.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search words..."
              className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-9 pr-8 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-600 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={openAddWord}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/10 active:scale-[.97] transition-all shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add Word</span>
          </button>
        </div>
      </div>

      {/* ── Folder View ────────────────────────────────────────────────── */}
      {!currentFolder && !searchTerm && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {folders.map(folder => (
            <button
              key={folder.name}
              onClick={() => setCurrentFolder(folder)}
              className="group relative flex flex-col items-start p-5 bg-slate-900/30 border border-white/5 rounded-2xl transition-all duration-200 hover:bg-slate-800/50 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 text-left"
            >
              <div
                className="mb-3 p-2.5 rounded-xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${folder.color}15`, color: folder.color }}
              >
                <Folder size={24} fill="currentColor" className="opacity-80" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-0.5 truncate w-full">{folder.name}</h3>
              <p className="text-xs text-slate-500">{folder.count} word{folder.count !== 1 ? 's' : ''}</p>
            </button>
          ))}

          {/* Add Word Card */}
          <button
            onClick={openAddWord}
            className="flex flex-col items-center justify-center p-5 border border-dashed border-white/10 rounded-2xl text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/[.02] transition-all min-h-[130px]"
          >
            <Plus size={24} className="mb-2 opacity-60" />
            <span className="text-xs font-medium">Add Word</span>
          </button>

          {folders.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <Folder size={28} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">No collections yet</p>
              <p className="text-slate-600 text-xs">Add your first word to get started</p>
            </div>
          )}
        </div>
      )}

      {/* ── Word List ──────────────────────────────────────────────────── */}
      {(currentFolder || searchTerm) && (
        <>
          {visibleWords.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium">
                {searchTerm ? `No words matching "${searchTerm}"` : 'No words in this collection yet'}
              </p>
              {!searchTerm && (
                <button
                  onClick={openAddWord}
                  className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors"
                >
                  + Add a word
                </button>
              )}
            </div>
          )}

          <div className="space-y-2">
            {visibleWords.map(word => (
              <div
                key={word.id}
                className="group relative flex items-center justify-between p-4 bg-slate-900/30 border border-white/5 rounded-2xl hover:bg-slate-800/40 hover:border-white/10 transition-all cursor-pointer"
                onClick={() => setSelectedWordId(word.id)}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: word.folderColor || '#3b82f6' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-base font-bold text-white truncate">{word.term}</h4>
                      <PosBadge pos={word.partOfSpeech || word.enrichment?.entries?.[0]?.partOfSpeech} />
                    </div>
                    <p className="text-slate-500 text-sm truncate">
                      {word.primaryDefinition || word.definition || word.translation || 'Tap to view details'}
                    </p>
                  </div>
                </div>

                <div className="relative shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setActiveMenu(activeMenu === word.id ? null : word.id)}
                    className="p-2 text-slate-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {activeMenu === word.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => { setEditTarget(word); setModalMode('edit_word'); setActiveMenu(null) }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white text-left transition-colors"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => { handleDeleteWord(word.id); setActiveMenu(null) }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 text-left transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Click-away for menus ───────────────────────────────────────── */}
      {activeMenu && <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWordId(null)}
          onEnrich={handleEnrichWord}
        />
      )}

      {modalMode === 'add_word' && (
        <AddWordModal
          folders={folders}
          currentFolder={currentFolder}
          onClose={() => setModalMode(null)}
          targetUid={targetUid}
          isTeacherView={isTeacherView}
        />
      )}

      {modalMode === 'edit_word' && editTarget && (
        <EditWordModal
          word={editTarget}
          folders={folders}
          onClose={() => { setModalMode(null); setEditTarget(null) }}
          targetUid={targetUid}
        />
      )}
    </div>
  )
}
