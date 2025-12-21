import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Book,
  Sparkles,
  Brain,
  ArrowRight,
  Flame,
  Languages,
  Loader2,
  Save,
  Check,
  X,
  Trophy,
  FolderPlus,
  Folder
} from 'lucide-react'

import { calculateStats } from '../../lib/gamification'
import { generateContent } from '../../lib/ai'
import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// Consistent colors for new folders
const FOLDER_COLORS = [
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#22c55e', // Green
  '#f97316', // Orange
  '#ec4899', // Pink
  '#ef4444', // Red
];

export default function Dashboard({ user, words = [], events = [] }) {
  const navigate = useNavigate()
  const upcomingCount = events.length || 0

  const stats = useMemo(() => calculateStats(words), [words])

  // --- TRANSLATOR STATE ---
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  
  // --- SAVE MODAL STATE ---
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [targetFolder, setTargetFolder] = useState('') // Name of selected/new folder
  const [isNewFolder, setIsNewFolder] = useState(false) // Toggle input for new folder
  const [hasSaved, setHasSaved] = useState(false)

  // 1. EXTRACT EXISTING FOLDERS (Same logic as WordBank)
  const existingFolders = useMemo(() => {
    const map = new Map();
    words.forEach(w => {
      if (!map.has(w.category)) {
        map.set(w.category, { name: w.category, color: w.folderColor || '#3b82f6' });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [words]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return

    setIsTranslating(true)
    setHasSaved(false)

    const prompt = `Translate the following English text to Spanish. Return ONLY the Spanish translation, nothing else. Text: "${inputText}"`

    try {
      const result = await generateContent(prompt)
      setTranslatedText(result.trim())
    } catch (error) {
      console.error('Translation Failed:', error)
      setTranslatedText(`Error: ${error?.message || 'AI request failed'}`)
    } finally {
      setIsTranslating(false)
    }
  }

  const saveToWordBank = async () => {
    if (!translatedText || !user || !targetFolder) return

    try {
      const wordsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank')

      // Determine color: Use existing if folder exists, else pick random
      const existing = existingFolders.find(f => f.name === targetFolder);
      const colorToUse = existing ? existing.color : FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)];

      await addDoc(wordsRef, {
        term: translatedText,    // SPANISH (Top line)
        definition: inputText,   // ENGLISH (Bottom line) - Changed from 'translation' to 'definition'
        category: targetFolder, 
        folderColor: colorToUse,
        createdAt: serverTimestamp(),
        mastery: 0,
      })

      // Success UI
      setShowSaveModal(false)
      setHasSaved(true)
      setTargetFolder('')
      setIsNewFolder(false)

      setTimeout(() => {
        setInputText('')
        setTranslatedText('')
        setHasSaved(false)
      }, 2000)

    } catch (err) {
      console.error('Failed to save word:', err)
      alert('Error saving to Word Bank.')
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-12 relative">
      
      {/* --- QUICK TRANSLATOR CARD --- */}
<div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                <Languages size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Quick Translator</h2>
            </div>
            {hasSaved && (
              <span className="text-green-400 text-sm font-bold flex items-center gap-1 animate-in fade-in">
                <Check size={16} /> Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* ENGLISH INPUT */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-indigo-300 uppercase ml-2 tracking-wider">
                English
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                  placeholder="Type to translate..."
                  className="w-full bg-[#0f172a]/60 border border-indigo-500/30 rounded-2xl p-4 text-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
                {inputText && (
                  <button
                    onClick={() => setInputText('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* ARROW ICON */}
            <div className="hidden md:flex flex-col items-center justify-center pt-6 text-indigo-400">
              {isTranslating ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}
            </div>

            {/* SPANISH OUTPUT */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-300 uppercase ml-2 tracking-wider">
                Spanish
              </label>
              <div className="relative group">
                <div
                  className={`w-full bg-[#0f172a]/80 border ${
                    translatedText ? 'border-purple-500/50 text-white' : 'border-indigo-500/10 text-slate-600'
                  } rounded-2xl p-4 text-lg min-h-[62px] flex items-center pr-12 transition-all`}
                >
                  {translatedText || 'Translation...'}
                </div>

                {/* SAVE BUTTON */}
                {translatedText && !hasSaved && !translatedText.startsWith('Error:') && (
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                    title="Save to Word Bank"
                  >
                    <Save size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* MOBILE TRANSLATE BUTTON */}
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="md:hidden w-full py-3 bg-indigo-600 rounded-xl text-white font-bold active:scale-95 transition-transform"
            >
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>
        </div>

        {/* --- SAVE FOLDER MODAL OVERLAY --- */}
        {showSaveModal && (
          <div className="absolute inset-0 z-50 rounded-3xl bg-[#02040a]/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            <div className="w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Save to Collection</h3>
                <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {/* EXISTING FOLDERS LIST */}
                {!isNewFolder && (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {existingFolders.map(f => (
                      <button
                        key={f.name}
                        onClick={() => setTargetFolder(f.name)}
                        className={`p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center gap-2 ${
                          targetFolder === f.name 
                          ? 'bg-indigo-600 border-indigo-500 text-white' 
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                    
                    {/* BUTTON TO TOGGLE NEW FOLDER INPUT */}
                    <button
                      onClick={() => { setIsNewFolder(true); setTargetFolder(''); }}
                      className="p-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <FolderPlus size={16} /> New Folder
                    </button>
                  </div>
                )}

                {/* NEW FOLDER INPUT */}
                {isNewFolder && (
                  <div className="animate-in slide-in-from-bottom-2">
                    <label className="text-xs text-slate-400 mb-1 block">New Folder Name</label>
                    <div className="flex gap-2">
                      <input 
                        autoFocus
                        value={targetFolder}
                        onChange={(e) => setTargetFolder(e.target.value)}
                        placeholder="e.g. Verbs, Travel..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={() => setIsNewFolder(false)}
                        className="p-2 text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM BUTTON */}
              <button
                disabled={!targetFolder}
                onClick={saveToWordBank}
                className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors mt-2"
              >
                Confirm Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- DASHBOARD STATS HEADER --- */}
      <header className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            Hey {user?.displayName?.split(' ')[0] || 'Student'} <span className="animate-wave inline-block">👋</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium flex items-center justify-center gap-2">
            One step closer to fluency
            {stats.streak > 0 && (
              <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full text-sm font-bold border border-orange-400/20">
                <Flame size={14} fill="currentColor" /> {stats.streak} Day Streak
              </span>
            )}
          </p>
        </div>

        <div className="max-w-xl mx-auto bg-[#1e293b] p-4 rounded-2xl border border-slate-800">
          <div className="flex justify-between text-sm font-bold text-slate-400 mb-2 px-1">
            <span className="text-white flex items-center gap-2">
              <Trophy size={14} className="text-yellow-500" />
              Level {stats.level}
            </span>
            <span>
              {Math.round(stats.currentLevelXP)} / {stats.xpForNextLevel} XP
            </span>
          </div>

          <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${(stats.currentLevelXP / stats.xpForNextLevel) * 100}%`,
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
              }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 blur-[1px]" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-right">
            {Math.ceil(10 - stats.currentLevelXP / 10)} words to next level
          </p>
        </div>
      </header>

      {/* --- NAVIGATION GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0">
        <MenuCard icon={<Book />} title="Word Bank" stats={`${words.length} words collected.`} desc="Grow your vocabulary." btnText="Open Word Bank" onClick={() => navigate('/words')} />
        <MenuCard icon={<CalendarIcon />} title="Schedule" stats={`${upcomingCount} lessons planned.`} desc="Plan your week." btnText="View Schedule" onClick={() => navigate('/calendar')} />
        <MenuCard icon={<Brain />} title="Study Mode" stats="Flashcards & quizzes." desc="Earn XP by practicing." btnText="Start Studying" onClick={() => navigate('/study')} />
        <MenuCard icon={<Sparkles />} title="AI Tools" stats="Translate & summarize." desc="Get smart assistance." btnText="Open AI Tools" onClick={() => navigate('/tools')} />
      </div>
    </div>
  )
}

function MenuCard({ icon, title, stats, desc, btnText, onClick }) {
  return (
    <div onClick={onClick} className="group relative rounded-3xl p-1 cursor-pointer transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 rounded-3xl bg-[#1e293b] opacity-60 backdrop-blur-xl border border-slate-800 group-hover:border-slate-600 transition-colors" />
      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-2xl text-cyan-300 shadow-inner group-hover:bg-white/10 group-hover:text-cyan-200 transition-colors">
              {React.cloneElement(icon, { size: 24 })}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400 font-medium">{desc}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 pl-1">
          <p className="text-slate-300 font-medium">{stats}</p>
        </div>

        <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)] hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
          {btnText} <ArrowRight size={16} className="opacity-40" />
        </button>
      </div>
    </div>
  )
}