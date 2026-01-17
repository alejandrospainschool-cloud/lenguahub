// src/modules/dashboard/Dashboard.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon, Book, Sparkles, Brain, ArrowRight,
  Flame, Languages, Loader2, Save, Check, X, Trophy, FolderPlus,
  Crown, Lock
} from 'lucide-react'

import { calculateStats } from '../../lib/gamification'
import { generateContent } from '../../lib/ai'
import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore'
import { hasReachedLimit } from '../../lib/freemium'
import LevelUpAnimation from '../../components/animations/LevelUpAnimation'
import StreakAnimation from '../../components/animations/StreakAnimation'
import { 
  checkLevelUp, 
  getPreviousStats, 
  saveCurrentStats,
  isStreakMilestone,
  getCelebrationMessages
} from '../../lib/animationHelpers' 

const FOLDER_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#ef4444']

export default function Dashboard({ 
  user, words = [], events = [], 
  isPremium, dailyUsage, trackUsage, onUpgrade 
}) {
  const navigate = useNavigate()
  const upcomingCount = events.length || 0
  const stats = useMemo(() => calculateStats(words), [words])

  // --- ANIMATION STATE ---
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false)
  const [showStreakAnimation, setShowStreakAnimation] = useState(false)
  const [newLevelReached, setNewLevelReached] = useState(null)
  const [previousStats, setPreviousStats] = useState(null)
  
  // Use refs to track if we've already shown animations this session
  const levelUpShownRef = useRef(false)
  const streakShownRef = useRef(false)

  // --- Track level ups and streaks ---
  useEffect(() => {
    if (!user?.uid) return

    const prev = getPreviousStats(user)
    
    // If no previous stats, initialize and return (first time loading this session)
    if (!prev) {
      saveCurrentStats(user, stats)
      return
    }

    setPreviousStats(prev)

    // Check if level up occurred (only show once per session)
    if (checkLevelUp(prev, stats) && !levelUpShownRef.current) {
      setNewLevelReached(stats.level)
      setShowLevelUpAnimation(true)
      levelUpShownRef.current = true
    }

    // Check if streak milestone reached (only show once per session)
    if (stats.streak > prev.streak && isStreakMilestone(stats.streak) && !streakShownRef.current) {
      setShowStreakAnimation(true)
      streakShownRef.current = true
    }

    // Save current stats for next comparison
    saveCurrentStats(user, stats)
  }, [stats, user])

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

  // Fetch user's firstName from Firestore if available
  const [userProfile, setUserProfile] = React.useState(null)
  React.useEffect(() => {
    if (!user?.uid) return
    const userRef = doc(db, 'users', user.uid)
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data())
      }
    })
    return () => unsub()
  }, [user?.uid])

  const firstName = userProfile?.firstName || user?.displayName?.split(' ')[0] || 'Student'
  const progressPct = stats.xpForNextLevel > 0 
    ? Math.min(100, Math.max(0, (stats.currentLevelXP / stats.xpForNextLevel) * 100)) 
    : 0

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 space-y-10 animate-slide-in pb-12">
      {/* ANIMATION OVERLAYS */}
      <LevelUpAnimation 
        level={newLevelReached}
        isVisible={showLevelUpAnimation}
        onComplete={() => setShowLevelUpAnimation(false)}
      />
      <StreakAnimation
        streak={stats.streak}
        isVisible={showStreakAnimation}
        onComplete={() => setShowStreakAnimation(false)}
      />
      
      {/* TRANSLATOR */}
      <section className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-2xl border border-blue-400/25 rounded-3xl p-7 relative overflow-hidden group shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300"
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500/30 to-cyan-500/20 rounded-xl text-blue-300 shadow-lg shadow-blue-500/20"><Languages size={24} /></div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Quick Translator</h2>
            </div>
            {hasSaved && <span className="text-emerald-400 text-sm font-bold flex items-center gap-1 bg-emerald-500/15 px-3 py-1.5 rounded-lg border border-emerald-400/30"><Check size={16} /> Saved!</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
             <div className="space-y-2">
               <label className="text-xs font-bold text-blue-300 uppercase ml-2 tracking-wider">English</label>
               <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTranslate()} className="w-full h-[64px] bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-blue-500/20 hover:border-blue-500/30 rounded-xl px-4 text-lg text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 shadow-sm shadow-blue-500/10" placeholder="Type to translate..." />
             </div>

             <div className="hidden md:flex justify-center text-slate-400 group-hover:text-blue-400 transition-colors">{isTranslating ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}</div>

             <div className="space-y-2 relative">
               <label className="text-xs font-bold text-cyan-300 uppercase ml-2 tracking-wider">Spanish</label>
               <div className="w-full h-[64px] bg-gradient-to-br from-cyan-900/30 to-blue-900/20 border border-cyan-500/20 rounded-xl px-4 text-lg flex items-center text-white shadow-sm shadow-cyan-500/10">{translatedText || <span className="text-slate-600">Translation...</span>}</div>
               {translatedText && !translatedText.startsWith('Error') && !hasSaved && (
                 <button onClick={() => setShowSaveModal(true)} className="absolute right-3 top-9 p-2.5 bg-gradient-to-br from-blue-600/30 to-blue-700/20 hover:from-blue-600/50 hover:to-blue-700/40 text-blue-300 rounded-lg active:scale-95 transition-all border border-blue-400/30 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25"><Save size={20} /></button>
               )}
             </div>
          </div>
          
          <div className="flex justify-end mt-6">
             <button onClick={handleTranslate} disabled={isTranslating || !inputText.trim()} className="px-7 py-3 bg-gradient-to-r from-blue-600/25 to-cyan-500/15 hover:from-blue-600/35 hover:to-cyan-500/25 border border-blue-400/40 hover:border-cyan-400/60 text-blue-300 hover:text-cyan-200 rounded-xl text-white font-bold transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/15 hover:shadow-cyan-500/25">
               {isTranslating ? 'Translating...' : 'Translate'}
             </button>
          </div>
        </div>

        {/* SAVE MODAL */}
        {showSaveModal && (
          <div className="absolute inset-0 z-50 rounded-3xl bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 border border-blue-500/20">
            <div className="w-full max-w-sm space-y-5 bg-gradient-to-br from-slate-900/70 to-slate-800/50 backdrop-blur-lg border border-blue-500/20 rounded-2xl p-7 shadow-2xl shadow-blue-500/20">
              <div className="flex justify-between text-white font-bold text-lg"><h3>Save to Collection</h3><button onClick={() => setShowSaveModal(false)} className="hover:text-slate-300 transition-colors"><X size={24} /></button></div>
              
              {!isNewFolder ? (
                 <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                   {existingFolders.map(f => (
                     <button key={f.name} onClick={() => setTargetFolder(f.name)} className={`p-3 rounded-lg border text-left text-sm font-medium transition-all ${targetFolder === f.name ? 'bg-blue-600/30 border-blue-400/50 text-blue-200 shadow-lg shadow-blue-500/15' : 'bg-slate-700/40 border-white/15 text-slate-300 hover:bg-slate-700/60 hover:border-white/25'}`}>
                       <span className="w-2.5 h-2.5 rounded-full inline-block mr-2" style={{backgroundColor: f.color}}/>{f.name}
                     </button>
                   ))}
                   <button onClick={() => {setIsNewFolder(true); setTargetFolder('')}} className="p-3 rounded-lg border border-dashed border-white/25 text-slate-400 hover:text-slate-200 hover:border-white/40 flex items-center justify-center gap-2 transition-all"><FolderPlus size={18}/> New</button>
                 </div>
              ) : (
                 <div className="flex gap-2">
                   <input autoFocus value={targetFolder} onChange={e => setTargetFolder(e.target.value)} placeholder="Folder Name" className="flex-1 bg-slate-700/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all" />
                   <button onClick={() => setIsNewFolder(false)} className="text-slate-400 hover:text-slate-300 transition-colors">Cancel</button>
                 </div>
              )}

              <button 
                disabled={!targetFolder.trim()} 
                onClick={saveToWordBank} 
                className="w-full py-3.5 bg-gradient-to-r from-blue-600/25 to-cyan-500/15 hover:from-blue-600/35 hover:to-cyan-500/25 text-blue-300 hover:text-cyan-200 font-bold rounded-xl disabled:opacity-50 border border-blue-400/40 hover:border-cyan-400/60 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15"
              >
                {hasReachedLimit(dailyUsage, 'wordsAdded', isPremium) && <Lock size={18} className="text-red-600"/>}
                Confirm Save
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. STATS HEADER */}
      <header className="text-center space-y-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Hey {firstName} <span className="animate-wave inline-block">👋</span></h1>
          <p className="text-slate-400 flex items-center justify-center gap-2 text-lg">
            One step closer to fluency
            {stats.streak > 0 && <span className="text-orange-400 bg-gradient-to-r from-orange-500/20 to-red-500/10 px-4 py-2 rounded-full text-sm font-bold border border-orange-400/30 shadow-lg shadow-orange-500/15"><Flame size={16} className="inline mr-1.5"/> {stats.streak} Day Streak</span>}
          </p>
        </div>
        
        <div className="max-w-xl mx-auto bg-gradient-to-br from-slate-800/50 to-slate-900/30 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/25 shadow-lg shadow-blue-500/10 group hover:shadow-blue-500/20 transition-all duration-300">
           <div className="flex justify-between text-sm font-bold text-slate-400 mb-3">
             <span className="text-white flex items-center gap-2 text-base"><Trophy size={18} className="text-yellow-400"/> Level {stats.level}</span>
             <span className="text-slate-300">{Math.round(stats.currentLevelXP)} / {stats.xpForNextLevel} XP</span>
           </div>
           <div className="h-3.5 bg-gradient-to-r from-slate-700/50 to-slate-800/30 rounded-full overflow-hidden border border-blue-500/15 shadow-inset">
             <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/40" style={{ width: `${progressPct}%` }} />
           </div>
        </div>
      </header>

      {/* 4. NAVIGATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        <MenuCard icon={<Book />} title="Word Bank" stats={`${words.length} words collected.`} desc="Grow your vocabulary." btnText="Open Word Bank" onClick={() => navigate('/words')} />
        <MenuCard icon={<CalendarIcon />} title="Schedule" stats={`${upcomingCount} lessons planned.`} desc="Plan your week." btnText="View Schedule" onClick={() => navigate('/calendar')} />
        <MenuCard icon={<Brain />} title="Study Mode" stats="Flashcards & quizzes." desc="Earn XP by practicing." btnText="Start Studying" onClick={() => navigate('/study')} />
        <MenuCard icon={<Sparkles />} title="AI Tools" stats="Translate & summarize." desc="Get smart assistance." btnText="Open AI Tools" onClick={() => navigate('/tools')} />
      </div>

      {/* 5. PAYWALL MODAL */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-amber-500/40 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl shadow-amber-500/20">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-600 shadow-lg shadow-amber-500/30" />
            <Crown className="w-20 h-20 text-amber-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
            <h2 className="text-3xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Free users can only add 5 words per day. Upgrade to Premium for unlimited access.
            </p>
            <button onClick={onUpgrade} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-lg rounded-xl mb-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-orange-500/30 border border-orange-400/30">
              Upgrade for £9.99
            </button>
            <button onClick={() => setShowPaywall(false)} className="text-slate-400 hover:text-slate-200 text-sm transition-colors">No thanks</button>
          </div>
        </div>
      )}

    </div>
  )
}

function MenuCard({ icon, title, stats, desc, btnText, onClick }) {
  return (
    <div onClick={onClick} className="group relative rounded-3xl p-1 cursor-pointer transition-transform duration-300 hover:-translate-y-2">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-2xl border border-slate-700/40 group-hover:border-blue-400/40 group-hover:from-slate-900/70 group-hover:to-slate-800/50 group-hover:shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-300" />
      <div className="relative z-10 p-7 flex flex-col h-full justify-between">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-xl text-blue-300 group-hover:from-blue-500/50 group-hover:to-blue-600/40 transition-all duration-300 shadow-lg shadow-blue-500/15">{React.cloneElement(icon, { size: 28 })}</div>
          <div><h3 className="text-2xl font-bold text-white">{title}</h3><p className="text-xs text-slate-400 font-semibold tracking-wide">{desc}</p></div>
        </div>
        <div className="mb-6 pl-1"><p className="text-slate-200 font-semibold text-sm">{stats}</p></div>
        <button className="w-full py-3 bg-gradient-to-r from-blue-600/25 to-cyan-500/15 hover:from-blue-600/35 hover:to-cyan-500/25 text-blue-300 hover:text-cyan-200 font-bold rounded-xl border border-blue-400/40 hover:border-cyan-400/60 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 group-hover:shadow-cyan-500/25">{btnText} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></button>
      </div>
    </div>
  )
}