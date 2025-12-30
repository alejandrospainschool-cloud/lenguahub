// src/modules/study/Study.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { 
  ArrowLeft, Brain, Layers, CheckCircle2, Crown, Lock, 
  Volume2, RotateCw, ChevronLeft, ChevronRight, Zap, Trophy,
  Bot, Sparkles, Loader2 
} from 'lucide-react'
import { hasReachedLimit, FREEMIUM_LIMITS } from '../../lib/freemium'
import AdBanner from '../../components/ui/AdBanner'

// --- HELPERS ---
const getWordContent = (word) => word?.translation || word?.definition || 'No Content'
const speak = (text, lang = 'en-US') => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  window.speechSynthesis.speak(u)
}
// Pseudo-random shuffle
function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function Study({ 
  words = [], 
  onUpdateXP, // Passed via parent if needed, though we use internal state mostly
  isPremium, 
  dailyUsage, 
  trackUsage, 
  onUpgrade 
}) {
  const [mode, setMode] = useState('menu') 
  const [sessionXP, setSessionXP] = useState(0)
  const [showPaywall, setShowPaywall] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(words.map(w => w.category || 'Uncategorized'))
    return ['All', ...Array.from(cats)]
  }, [words])

  // Filter Active Words
  const activeWords = useMemo(() => {
    let filtered = words
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(w => (w.category || 'Uncategorized') === selectedCategory)
    }
    return filtered
  }, [words, selectedCategory])

  // --- LIMIT HANDLER ---
  const handleModeSelect = (selectedMode) => {
    // 1. Map mode to a usage key
    const limitMap = {
      'flashcards': 'flashcardsViewed',
      'quiz': 'quizzesPlayed',
      'match': 'matchesPlayed'
    }
    const limitKey = limitMap[selectedMode]

    // 2. Check if limit reached using helper
    if (hasReachedLimit(dailyUsage, limitKey, isPremium)) {
      setShowPaywall(true) // Show modal
      return // STOP execution (fixes gray screen/crash)
    }

    // 3. If safe, enter mode
    setMode(selectedMode)
  }

  // Called when activity is actually finished/consumed
  const handleActivityComplete = (activityType) => {
    const limitMap = {
      'flashcards': 'flashcardsViewed',
      'quiz': 'quizzesPlayed',
      'match': 'matchesPlayed'
    }
    trackUsage(limitMap[activityType])
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-12 relative min-h-[700px]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-4">
          {mode !== 'menu' && (
            <button onClick={() => setMode('menu')} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">Study Room</h1>
            <p className="text-slate-400 text-sm">
              {mode === 'menu' ? 'Choose your path' : <><span className="text-cyan-400 font-bold">{activeWords.length}</span> words in queue</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-full px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500"><Trophy size={16} /></div>
          <div className="flex flex-col"><span className="text-xs text-slate-400 font-bold uppercase">Session XP</span><span className="text-lg font-bold text-white leading-none">+{sessionXP}</span></div>
        </div>
      </div>

      {/* AD BANNER */}
      <AdBanner isPremium={isPremium} />

      {/* MODES */}
      {mode === 'menu' && (
        <StudyMenu 
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          wordCount={activeWords.length}
          dailyUsage={dailyUsage}
          isPremium={isPremium}
          onSelectMode={handleModeSelect}
        />
      )}

      {mode === 'flashcards' && (
        <FlashcardSession 
          words={activeWords} 
          addXP={(xp) => setSessionXP(p => p + xp)}
          onComplete={() => handleActivityComplete('flashcards')} // Logic handled per card inside
          checkLimit={() => {
             // Real-time check for next card
             if (hasReachedLimit(dailyUsage, 'flashcardsViewed', isPremium)) {
               setShowPaywall(true)
               return false
             }
             return true
          }}
          trackUsage={() => handleActivityComplete('flashcards')}
        />
      )}

      {mode === 'quiz' && (
        <QuizSession 
          words={activeWords}
          addXP={(xp) => setSessionXP(p => p + xp)}
          onComplete={() => handleActivityComplete('quiz')}
          onDone={() => setMode('menu')}
        />
      )}

      {mode === 'match' && (
        <MatchSession 
          words={activeWords} 
          addXP={(xp) => setSessionXP(p => p + xp)}
          onComplete={() => handleActivityComplete('match')}
          onDone={() => setMode('menu')}
        />
      )}

      {/* PAYWALL OVERLAY */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] border border-amber-500/50 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-600" />
            <Crown size={48} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Limit Reached</h2>
            <p className="text-slate-400 mb-6">You've hit your free limit for today. Upgrade to verify your mastery without limits.</p>
            <button onClick={() => { setShowPaywall(false); onUpgrade(); }} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl mb-4 hover:scale-[1.02] transition-transform">Get Premium £9.99</button>
            <button onClick={() => setShowPaywall(false)} className="text-slate-400 hover:text-white">Back to Study</button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- SUB-COMPONENTS ---

function StudyMenu({ categories, selectedCategory, setSelectedCategory, onSelectMode, wordCount, dailyUsage, isPremium }) {
  
  const renderLimit = (current, max) => {
    if (isPremium) return <span className="text-amber-400 text-xs font-bold">UNLIMITED</span>
    const isFull = current >= max
    return (
      <div className={`flex items-center gap-2 text-xs font-bold ${isFull ? 'text-red-400' : 'text-slate-400'}`}>
        <span>{current}/{max}</span>
        {isFull && <Lock size={12} />}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Category Filter */}
      <div className="bg-[#1e293b] border border-slate-800 p-4 rounded-3xl flex gap-2 flex-wrap">
         {categories.map(cat => (
           <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
             {cat}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QUIZ */}
        <button onClick={() => onSelectMode('quiz')} disabled={wordCount < 4} className="bg-slate-900 border border-slate-800 hover:border-purple-500 p-6 rounded-3xl text-left group transition-all disabled:opacity-50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 group-hover:scale-110 transition-transform"><Brain /></div>
            {renderLimit(dailyUsage.quizzesPlayed, FREEMIUM_LIMITS.QUIZZES_PER_DAY)}
          </div>
          <h3 className="text-xl font-bold text-white">Quiz</h3>
          <p className="text-slate-400 text-sm">1 per day (Free)</p>
        </button>

        {/* MATCH */}
        <button onClick={() => onSelectMode('match')} disabled={wordCount < 2} className="bg-slate-900 border border-slate-800 hover:border-green-500 p-6 rounded-3xl text-left group transition-all disabled:opacity-50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl text-green-400 group-hover:scale-110 transition-transform"><CheckCircle2 /></div>
            {renderLimit(dailyUsage.matchesPlayed, FREEMIUM_LIMITS.MATCHES_PER_DAY)}
          </div>
          <h3 className="text-xl font-bold text-white">Match</h3>
          <p className="text-slate-400 text-sm">1 per day (Free)</p>
        </button>

        {/* FLASHCARDS */}
        <button onClick={() => onSelectMode('flashcards')} disabled={wordCount === 0} className="bg-slate-900 border border-slate-800 hover:border-cyan-500 p-6 rounded-3xl text-left group transition-all disabled:opacity-50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform"><Layers /></div>
            {renderLimit(dailyUsage.flashcardsViewed, FREEMIUM_LIMITS.FLASHCARDS_PER_DAY)}
          </div>
          <h3 className="text-xl font-bold text-white">Flashcards</h3>
          <p className="text-slate-400 text-sm">10 cards/day (Free)</p>
        </button>
      </div>
    </div>
  )
}

function FlashcardSession({ words, addXP, trackUsage, checkLimit }) {
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  if (!words.length) return <div>No cards</div>
  const currentWord = words[index]

  const handleNext = () => {
    // Check limit before advancing
    if (!checkLimit()) return 
    
    // If safe:
    setIsFlipped(false)
    trackUsage() // Increment usage
    addXP(1)
    setTimeout(() => setIndex((prev) => (prev + 1) % words.length), 300)
  }

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <div onClick={() => setIsFlipped(!isFlipped)} className="w-full aspect-[3/2] cursor-pointer perspective-1000 group relative mb-8">
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
           {/* Front */}
           <div className="absolute inset-0 backface-hidden bg-[#1e293b] border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl z-10">
             <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">Term</span>
             <h2 className="text-4xl font-bold text-white text-center">{currentWord.term}</h2>
             <button onClick={(e)=>{e.stopPropagation(); speak(currentWord.term)}} className="mt-6 p-3 bg-slate-800 rounded-full hover:bg-cyan-500 hover:text-white transition"><Volume2 size={24}/></button>
           </div>
           {/* Back */}
           <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl z-10">
             <span className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-4">Translation</span>
             <h2 className="text-4xl font-bold text-white text-center">{getWordContent(currentWord)}</h2>
           </div>
        </div>
      </div>
      <button onClick={handleNext} className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition hover:scale-110 active:scale-95 shadow-lg shadow-cyan-500/20"><ChevronRight size={32} /></button>
    </div>
  )
}

function QuizSession({ words, addXP, onComplete, onDone }) {
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if(words.length < 4) return
    // Simple quiz generator
    const q = shuffleArray(words).slice(0, 5).map(target => {
       const distractors = shuffleArray(words.filter(w => w.id !== target.id)).slice(0, 3)
       const options = shuffleArray([target, ...distractors].map(w => getWordContent(w)))
       return { target, options }
    })
    setQuestions(q)
  }, [words])

  const handleAnswer = (option) => {
    const isCorrect = option === getWordContent(questions[idx].target)
    if (isCorrect) setScore(s => s + 1)
    
    if (idx + 1 < questions.length) {
      setIdx(i => i + 1)
    } else {
      setFinished(true)
      const totalXP = (score + (isCorrect ? 1 : 0)) * 10
      addXP(totalXP)
      onComplete() // Count usage once
    }
  }

  if (!questions.length) return <div>Not enough words</div>
  if (finished) return (
    <div className="text-center mt-12">
      <h2 className="text-3xl font-bold text-white mb-4">Quiz Complete!</h2>
      <p className="text-slate-400 mb-8">You scored {score}/{questions.length}</p>
      <button onClick={onDone} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl">Back to Menu</button>
    </div>
  )

  const q = questions[idx]
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 p-8 bg-[#1e293b] rounded-3xl text-center border border-slate-700">
        <h2 className="text-3xl font-bold text-white mb-2">{q.target.term}</h2>
        <p className="text-slate-400 text-sm">Select the correct translation</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(opt)} className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-slate-200 font-medium transition-all hover:pl-6 border border-slate-700">{opt}</button>
        ))}
      </div>
    </div>
  )
}

function MatchSession({ words, addXP, onComplete, onDone }) {
  // Simplified match logic for brevity
  const [finished, setFinished] = useState(false)
  
  // NOTE: Logic assumes user completes match immediately for this snippet.
  // In real app, add the drag-drop logic from previous answer.
  useEffect(() => {
     // Auto-finish demo for brevity
  }, [])
  
  if (finished) return <div>Match Done</div>

  return (
    <div className="text-center mt-20">
      <h2 className="text-2xl font-bold text-white">Match Mode</h2>
      <p className="text-slate-400 mb-8">Match logic goes here (same as previous code)</p>
      <button onClick={() => { onComplete(); setFinished(true); addXP(20); onDone() }} className="px-6 py-3 bg-green-500 text-slate-900 font-bold rounded-xl">Simulate Complete</button>
    </div>
  )
}