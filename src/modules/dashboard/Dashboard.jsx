// src/modules/dashboard/Dashboard.jsx
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon, Book, Sparkles, Brain, ArrowRight,
  Flame, Languages, Loader2, Save, Check, X, Trophy, FolderPlus,
  Crown, Lock
} from 'lucide-react'

import { calculateStats } from '../../lib/gamification'
import { generateContent } from '../../lib/ai'
import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { hasReachedLimit } from '../../lib/freemium' 

const FOLDER_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#ef4444']

export default function Dashboard({ 
  user, words = [], events = [], 
  isPremium, dailyUsage, trackUsage, onUpgrade 
}) {
  const navigate = useNavigate()
  const upcomingCount = events.length || 0
  const stats = useMemo(() => calculateStats(words), [words])

  // --- STATE ---
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false) 
  const [targetFolder, setTargetFolder] = useState('')
  const [isNewFolder, setIsNewFolder] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

  // Extract Folders
  const existingFolders = useMemo(() => {
    const map = new Map()
    words.forEach((w) => {
      if (!w?.category) return
      if (!map.has(w.category)) {
        map.set(w.category, { name: w.category, color: w.folderColor || '#3b82f6' })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [words])

  // --- TRANSLATE LOGIC ---
  const handleTranslate = async () => {
    if (!inputText.trim() || isTranslating) return
    setIsTranslating(true)
    setHasSaved(false)
    const prompt = `Translate the following English text to Spanish. Return ONLY the Spanish translation. Text: "${inputText}"`
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

  // --- SAVE LOGIC (WITH LIMITS) ---
  const saveToWordBank = async () => {
    if (!translatedText || !user || !targetFolder) return

    // 1. CHECK LIMIT
    if (hasReachedLimit(dailyUsage, 'wordsAdded', isPremium)) {
      setShowPaywall(true)
      return
    }

    try {
      const wordsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank')
      const existing = existingFolders.find((f) => f.name === targetFolder)
      const colorToUse = existing ? existing.color : FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)]

      await addDoc(wordsRef, {
        term: translatedText,
        definition: inputText,
        category: targetFolder,
        folderColor: colorToUse,
        createdAt: serverTimestamp(),
        mastery: 0,
      })

      // 2. TRACK USAGE
      trackUsage('wordsAdded')

      // Reset UI
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

  const firstName = user?.displayName?.split(' ')[0] || 'Student'
  const progressPct = stats.xpForNextLevel > 0 
    ? Math.min(100, Math.max(0, (stats.currentLevelXP / stats.xpForNextLevel) * 100)) 
    : 0

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 space-y-10 animate-in fade-in duration-500 pb-12">
      
      {/* TRANSLATOR */}
      <section className="bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Languages size={22} /></div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Quick Translator</h2>
            </div>
            {hasSaved && <span className="text-green-400 text-sm font-bold flex items-center gap-1"><Check size={16} /> Saved!</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
             <div className="space-y-2">
               <label className="text-xs font-bold text-blue-300 uppercase ml-2">English</label>
               <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTranslate()} className="w-full h-[62px] bg-slate-800/50 border border-white/10 rounded-lg px-4 text-lg text-white placeholder:text-slate-500 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/30 transition-all" placeholder="Type to translate..." />
             </div>

             <div className="hidden md:flex justify-center text-slate-400">{isTranslating ? <Loader2 className="animate-spin" /> : <ArrowRight />}</div>

             <div className="space-y-2 relative">
               <label className="text-xs font-bold text-cyan-300 uppercase ml-2">Spanish</label>
               <div className="w-full h-[62px] bg-slate-800/50 border border-white/10 rounded-lg px-4 text-lg flex items-center text-white">{translatedText || <span className="text-slate-600">Translation...</span>}</div>
               {translatedText && !translatedText.startsWith('Error') && !hasSaved && (
                 <button onClick={() => setShowSaveModal(true)} className="absolute right-2 top-8 p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg active:scale-95 transition-all border border-blue-400/30"><Save size={18} /></button>
               )}
             </div>
          </div>
          
          <div className="flex justify-end mt-4">
             <button onClick={handleTranslate} disabled={isTranslating || !inputText.trim()} className="px-6 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-400/30 text-blue-400 rounded-lg text-white font-bold transition-all disabled:opacity-50">
               {isTranslating ? 'Translating...' : 'Translate'}
             </button>
          </div>
        </div>

        {/* SAVE MODAL */}
        {showSaveModal && (
          <div className="absolute inset-0 z-50 rounded-2xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-4 bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <div className="flex justify-between text-white font-bold"><h3>Save to Collection</h3><button onClick={() => setShowSaveModal(false)}><X /></button></div>
              
              {!isNewFolder ? (
                 <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                   {existingFolders.map(f => (
                     <button key={f.name} onClick={() => setTargetFolder(f.name)} className={`p-3 rounded-lg border text-left text-sm font-medium transition-all ${targetFolder === f.name ? 'bg-blue-600/20 border-blue-400/50 text-blue-300' : 'bg-slate-700/30 border-white/10 text-slate-300 hover:bg-slate-700/50'}`}>
                       <span className="w-2 h-2 rounded-full inline-block mr-2" style={{backgroundColor: f.color}}/>{f.name}
                     </button>
                   ))}
                   <button onClick={() => {setIsNewFolder(true); setTargetFolder('')}} className="p-3 rounded-lg border border-dashed border-white/20 text-slate-400 hover:text-slate-300 flex items-center justify-center gap-2 transition-all"><FolderPlus size={16}/> New</button>
                 </div>
              ) : (
                 <div className="flex gap-2">
                   <input autoFocus value={targetFolder} onChange={e => setTargetFolder(e.target.value)} placeholder="Folder Name" className="flex-1 bg-slate-700/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50" />
                   <button onClick={() => setIsNewFolder(false)} className="text-slate-400 hover:text-slate-300">Cancel</button>
                 </div>
              )}

              <button 
                disabled={!targetFolder.trim()} 
                onClick={saveToWordBank} 
                className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold rounded-lg disabled:opacity-50 border border-blue-400/30 transition-all flex items-center justify-center gap-2"
              >
                {hasReachedLimit(dailyUsage, 'wordsAdded', isPremium) && <Lock size={16} className="text-red-600"/>}
                Confirm Save
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. STATS HEADER */}
      <header className="text-center space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Hey {firstName} <span className="animate-wave inline-block">👋</span></h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            One step closer to fluency
            {stats.streak > 0 && <span className="text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full text-sm font-bold border border-orange-400/20"><Flame size={14} className="inline mr-1"/> {stats.streak} Day Streak</span>}
          </p>
        </div>
        
        <div className="max-w-xl mx-auto bg-slate-800/30 backdrop-blur-md p-4 rounded-lg border border-white/10">
           <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
             <span className="text-white flex items-center gap-2"><Trophy size={14} className="text-yellow-500"/> Level {stats.level}</span>
             <span>{Math.round(stats.currentLevelXP)} / {stats.xpForNextLevel} XP</span>
           </div>
           <div className="h-3 bg-slate-700/30 rounded-full overflow-hidden border border-white/5">
             <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }} />
           </div>
        </div>
      </header>

      {/* 4. NAVIGATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MenuCard icon={<Book />} title="Word Bank" stats={`${words.length} words collected.`} desc="Grow your vocabulary." btnText="Open Word Bank" onClick={() => navigate('/words')} />
        <MenuCard icon={<CalendarIcon />} title="Schedule" stats={`${upcomingCount} lessons planned.`} desc="Plan your week." btnText="View Schedule" onClick={() => navigate('/calendar')} />
        <MenuCard icon={<Brain />} title="Study Mode" stats="Flashcards & quizzes." desc="Earn XP by practicing." btnText="Start Studying" onClick={() => navigate('/study')} />
        <MenuCard icon={<Sparkles />} title="AI Tools" stats="Translate & summarize." desc="Get smart assistance." btnText="Open AI Tools" onClick={() => navigate('/tools')} />
      </div>

      {/* 5. PAYWALL MODAL */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e293b] border border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-600" />
            <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <h2 className="text-2xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-slate-400 mb-6">
              Free users can only add 5 words per day. Upgrade to Premium for unlimited access.
            </p>
            <button onClick={onUpgrade} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl mb-3 hover:scale-[1.02] transition-transform shadow-lg shadow-orange-500/20">
              Upgrade for £9.99
            </button>
            <button onClick={() => setShowPaywall(false)} className="text-slate-500 hover:text-white text-sm">No thanks</button>
          </div>
        </div>
      )}

    </div>
  )
}

function MenuCard({ icon, title, stats, desc, btnText, onClick }) {
  return (
    <div onClick={onClick} className="group relative rounded-2xl p-1 cursor-pointer transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 rounded-2xl bg-slate-800/30 backdrop-blur-md border border-white/10 group-hover:border-white/20 group-hover:bg-slate-800/40 transition-all" />
      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 group-hover:bg-blue-500/30 transition-colors">{React.cloneElement(icon, { size: 24 })}</div>
          <div><h3 className="text-xl font-bold text-white">{title}</h3><p className="text-xs text-slate-400 font-medium">{desc}</p></div>
        </div>
        <div className="mb-6 pl-1"><p className="text-slate-300 font-medium">{stats}</p></div>
        <button className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold rounded-lg border border-blue-400/30 transition-all flex items-center justify-center gap-2">{btnText} <ArrowRight size={16} className="opacity-60" /></button>
      </div>
    </div>
  )
}