import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  RotateCw, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Filter, 
  Lock, 
  Trophy, 
  Sparkles,
  Zap,
  Crown,
  Volume2,
  Bot,
  Loader2,
  CheckCircle2,
  X,
  XCircle
} from 'lucide-react';

// Import your new helpers
import { hasReachedLimit, FREEMIUM_LIMITS } from '../../lib/freemium';
import AdBanner from '../../components/ui/AdBanner';

// --- HELPER: SAFE TEXT CONTENT ---
const getWordContent = (word) => {
  if (!word) return '';
  return word.translation || word.definition || word.meaning || word.answer || 'No Translation';
};

// --- HELPER: TEXT-TO-SPEECH ---
const speak = (text, lang = 'en-US') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; 
  utterance.rate = 0.8;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(lang));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
};

// --- HELPER: AI GENERATION ---
const generateAIContext = async (term, translation) => {
  // ... (Your existing AI logic) ...
  return "Example sentence placeholder due to missing API key in snippet."; 
};

// Small helper to call callbacks safely
const safeCall = (fn, ...args) => {
  try {
    if (typeof fn === 'function') return fn(...args);
  } catch (err) {
    console.error('safeCall error', err);
  }
};

const XP_REWARDS = {
  quiz_correct: 10,
  quiz_perfect_bonus: 50,
  flashcard_flip: 1,
  match_correct: 8,
};

export default function Study({ 
  words = [], 
  onUpdateXP, 
  targetLanguage = 'es-ES',
  // NEW PROPS FROM APP.JSX
  isPremium,
  dailyUsage,
  trackUsage,
  onUpgrade
}) {
  const [mode, setMode] = useState('menu'); // 'menu', 'flashcards', 'quiz', 'match'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sessionXP, setSessionXP] = useState(0);
  
  // Advanced Options State
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [isSmartReview, setIsSmartReview] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // We keep 'mastery' in local storage for SRS, but REMOVE usage tracking from here
  // because we are now using the 'dailyUsage' prop from Firebase/App.jsx
  const [localMastery, setLocalMastery] = useState(() => {
    try {
      const saved = localStorage.getItem('study_mastery');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('study_mastery', JSON.stringify(localMastery));
  }, [localMastery]);

  // --- FILTERING LOGIC ---
  const categories = useMemo(() => {
    const cats = new Set(words.map(w => w.category || 'Uncategorized'));
    return ['All', ...Array.from(cats)];
  }, [words]);

  const activeWords = useMemo(() => {
    let filtered = words;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(w => (w.category || 'Uncategorized') === selectedCategory);
    }
    // Smart Review Logic (SRS)
    if (isSmartReview) {
      filtered = [...filtered].sort((a, b) => {
        const scoreA = localMastery[a.id] || 0;
        const scoreB = localMastery[b.id] || 0;
        return scoreA - scoreB; 
      });
      filtered = filtered.slice(0, 20);
    }
    return filtered;
  }, [words, selectedCategory, isSmartReview, localMastery]);

  // --- ACTIONS ---
  const handleAddXP = (amount) => {
    setSessionXP(prev => prev + amount);
    if (onUpdateXP) onUpdateXP(amount);
  };

  const updateMastery = (wordId, change) => {
    setLocalMastery(prev => ({
      ...prev,
      [wordId]: Math.max(0, (prev[wordId] || 0) + change)
    }));
  };

  // --- SAFE MODE SWITCHING (Fixes Gray Screen) ---
  const handleModeSelect = (targetMode) => {
    // 1. Check if we have words
    if (activeWords.length === 0) {
      alert("No words available in this category.");
      return;
    }

    // 2. Map mode to limit key
    const limitMap = {
      'flashcards': 'flashcardsViewed',
      'quiz': 'quizzesPlayed',
      'match': 'matchesPlayed'
    };
    
    // 3. Check Limit
    if (hasReachedLimit(dailyUsage, limitMap[targetMode], isPremium)) {
      setShowPaywall(true);
      return;
    }

    // 4. Go to mode
    setMode(targetMode);
  };

  // Callback when a user *completes* an action (consumes a credit)
  const handleUsage = (type) => {
    const limitMap = {
      'flashcards': 'flashcardsViewed',
      'quiz': 'quizzesPlayed',
      'match': 'matchesPlayed'
    };
    trackUsage(limitMap[type]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-500 pb-12 relative min-h-[700px]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-4">
          {mode !== 'menu' && (
            <button 
              onClick={() => setMode('menu')}
              className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              Study Room
            </h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              {mode === 'menu' 
                ? 'Choose your path' 
                : <><span className="text-cyan-400 font-bold">{activeWords.length}</span> words in queue</>
              }
              {isSmartReview && <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded border border-orange-500/30">Smart Review</span>}
            </p>
          </div>
        </div>

        {/* XP Display */}
        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-full px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Trophy size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase">Session XP</span>
            <span className="text-lg font-bold text-white leading-none">+{sessionXP}</span>
          </div>
        </div>
      </div>

      {/* --- GOOGLE AD BANNER --- */}
      <div className="mb-6">
        <AdBanner isPremium={isPremium} />
      </div>

      {/* --- VIEW ROUTER --- */}
      {mode === 'menu' && (
        <StudyMenu 
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          wordCount={activeWords.length}
          
          // Updated to use Global Freemium Logic
          dailyUsage={dailyUsage}
          isPremium={isPremium}
          onSelectMode={handleModeSelect}
          
          isTypingMode={isTypingMode}
          setIsTypingMode={setIsTypingMode}
          isSmartReview={isSmartReview}
          setIsSmartReview={setIsSmartReview}
          setShowPaywall={setShowPaywall}
        />
      )}

      {mode === 'flashcards' && (
        <FlashcardSession 
          words={activeWords} 
          addXP={handleAddXP} 
          
          // Updated Usage Logic
          onCardViewed={() => handleUsage('flashcards')}
          checkLimit={() => {
            if (hasReachedLimit(dailyUsage, 'flashcardsViewed', isPremium)) {
              setShowPaywall(true);
              return false;
            }
            return true;
          }}
          usage={dailyUsage.flashcardsViewed} // Pass current count for UI

          targetLanguage={targetLanguage}
        />
      )}

      {mode === 'quiz' && (
        <QuizSession 
          words={activeWords}
          addXP={(v) => safeCall(handleAddXP, v)}
          onComplete={() => safeCall(() => handleUsage('quiz'))}
          updateMastery={(id, delta) => safeCall(updateMastery, id, delta)}
          isTypingMode={isTypingMode}
          targetLanguage={targetLanguage}
          onDone={() => setMode('menu')}
        />
      )}

      {mode === 'match' && (
        <MatchSession 
          words={activeWords} 
          addXP={(v) => safeCall(handleAddXP, v)}
          onComplete={() => safeCall(() => handleUsage('match'))}
          updateMastery={(id, delta) => safeCall(updateMastery, id, delta)}
          targetLanguage={targetLanguage}
          onDone={() => setMode('menu')}
        />
      )}

      {/* --- PAYWALL MODAL --- */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] border border-amber-500/50 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
            
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20">
              <Crown size={40} strokeWidth={1.5} />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-slate-400 mb-8">
              You've hit your free limit for today. Upgrade to Premium for unlimited access and smart reviews.
            </p>
            
            <button 
              onClick={() => { setShowPaywall(false); onUpgrade(); }} 
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl mb-3 hover:scale-[1.02] transition-transform"
            >
              Get Premium for £9.99
            </button>
            <button 
              onClick={() => setShowPaywall(false)} 
              className="w-full py-3 text-slate-500 hover:text-white font-medium"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 1. MENU COMPONENT
// ==========================================
function StudyMenu({ 
  categories, selectedCategory, setSelectedCategory, 
  onSelectMode, wordCount, 
  dailyUsage, isPremium,
  isTypingMode, setIsTypingMode,
  isSmartReview, setIsSmartReview,
  setShowPaywall
}) {
  
  const getLimitProgress = (current, max) => Math.min(100, (current / max) * 100);

  const renderLimitBar = (current, max, colorClass, limitName) => {
    if (isPremium) {
        return (
            <div className="flex flex-col items-end">
                 <span className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Crown size={12}/> UNLIMITED
                 </span>
            </div>
        )
    }
    
    const isFull = current >= max;
    return (
        <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-500 mb-1">DAILY LIMIT</span>
            <div className="flex items-center gap-2 text-sm text-slate-300">
                {isFull && <Lock size={14} className="text-orange-500" />}
                <span>{current}/{max}</span>
            </div>
            <div className="w-20 h-1 bg-slate-800 rounded-full mt-2">
                <div 
                className={`h-full rounded-full ${isFull ? 'bg-orange-500' : colorClass}`} 
                style={{ width: `${getLimitProgress(current, max)}%` }}
                />
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* FILTER & TOGGLES BAR */}
      <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-400 uppercase tracking-widest text-xs font-bold">
            <Filter size={14} />
            <span>Study Filters</span>
          </div>
          
          <button 
            onClick={() => setIsSmartReview(!isSmartReview)}
            className={`group flex items-center gap-3 pl-3 pr-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              isSmartReview 
                ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 text-orange-200' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSmartReview ? 'bg-orange-500 text-white' : 'bg-slate-600'}`}>
              <Brain size={14} />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className={`block mb-0.5 ${isSmartReview ? 'text-orange-400' : 'text-slate-300'}`}>Smart Review</span>
              <span className="opacity-60 font-normal">{isSmartReview ? 'On' : 'Off'}</span>
            </div>
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat 
                  ? 'bg-white text-slate-900 shadow-lg shadow-white/10 scale-105' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MODE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Flashcards Option */}
        <button
          onClick={() => onSelectMode('flashcards')}
          disabled={wordCount === 0}
          className="group relative bg-[#0f172a] border border-slate-800 hover:border-cyan-500/50 rounded-[32px] p-8 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Layers size={32} />
            </div>
            {renderLimitBar(dailyUsage.flashcardsViewed, FREEMIUM_LIMITS.FLASHCARDS_PER_DAY, 'bg-cyan-500')}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Flashcards</h2>
          <p className="text-slate-400">Flip cards with AI & Audio support.</p>
        </button>

        {/* Quiz Option */}
        <button 
            onClick={() => onSelectMode('quiz')}
            disabled={wordCount < 4}
            className="group relative bg-[#0f172a] border border-slate-800 hover:border-purple-500/50 rounded-[32px] p-8 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
            <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Brain size={32} />
            </div>
            {renderLimitBar(dailyUsage.quizzesPlayed, FREEMIUM_LIMITS.QUIZZES_PER_DAY, 'bg-purple-500')}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Quiz Mode</h2>
            <p className="text-slate-400 mb-4">Test your knowledge.</p>
        </button>

        {/* Match Option */}
        <button 
            onClick={() => onSelectMode('match')}
            disabled={wordCount < 2}
            className="group relative bg-[#0f172a] border border-slate-800 hover:border-green-500/50 rounded-[32px] p-8 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
            <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={32} />
            </div>
            {renderLimitBar(dailyUsage.matchesPlayed, FREEMIUM_LIMITS.MATCHES_PER_DAY, 'bg-green-500')}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Match</h2>
            <p className="text-slate-400">Match terms to their translations.</p>
        </button>

      </div>
    </div>
  );
}

// ==========================================
// 2. FLASHCARD SESSION
// ==========================================
function FlashcardSession({ words, addXP, onCardViewed, checkLimit, usage, targetLanguage }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // AI State
  const [aiContext, setAiContext] = useState(null); 
  const [loadingAi, setLoadingAi] = useState(false);

  // FIX: Safety Check
  if (!words || words.length === 0) return <div>No cards available</div>;
  const currentWord = words[index];

  useEffect(() => {
    setAiContext(null);
    setLoadingAi(false);
  }, [index]);

  const handleNext = () => {
    // FIX: Check Limit before proceeding
    if (!checkLimit()) return;

    setIsFlipped(false);
    onCardViewed(); // Increment usage
    addXP(XP_REWARDS.flashcard_flip);
    setTimeout(() => setIndex((prev) => (prev + 1) % words.length), 300);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setIndex((prev) => (prev - 1 + words.length) % words.length), 300);
  };

  const handleAiRequest = async (e) => {
    e.stopPropagation();
    if (aiContext) return;
    setLoadingAi(true);
    const result = await generateAIContext(currentWord.term, getWordContent(currentWord));
    setAiContext(result);
    setLoadingAi(false);
  };

  const getTextSize = (text) => {
    if (!text) return 'text-xl';
    if (text.length > 20) return 'text-2xl';
    if (text.length > 10) return 'text-4xl';
    return 'text-5xl';
  };

  const translationText = getWordContent(currentWord);

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      
      {/* Progress */}
      <div className="mb-6 flex items-center gap-4 text-slate-500 font-bold tracking-widest text-sm">
        <span>CARD {index + 1} / {words.length}</span>
        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
        <span className="text-cyan-500 flex items-center gap-1">
          <Zap size={14} /> Today: {usage}
        </span>
      </div>

      {/* THE CARD */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full aspect-[3/2] cursor-pointer perspective-1000 group relative"
      >
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT */}
          <div className="absolute inset-0 backface-hidden bg-[#1e293b] border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl z-10">
            <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">Term</span>
            <h2 className={`${getTextSize(currentWord.term)} font-bold text-white text-center break-words max-w-full px-4`}>
              {currentWord.term}
            </h2>
            
            <button 
              onClick={(e) => { e.stopPropagation(); speak(currentWord.term, targetLanguage); }}
              className="mt-6 p-3 bg-slate-800 rounded-full hover:bg-cyan-500 hover:text-white text-slate-400 transition-colors"
            >
              <Volume2 size={24} />
            </button>
            
            <p className="absolute bottom-8 text-slate-500 text-sm flex items-center gap-2">
              <RotateCw size={14} /> Click to flip
            </p>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl border-2 border-cyan-400/50 z-10 overflow-hidden">
            
            {!aiContext ? (
              <>
                <span className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-4">Translation</span>
                <h2 className={`${getTextSize(translationText)} font-bold text-white text-center break-words max-w-full px-4 mb-4`}>
                  {translationText}
                </h2>
                
                <button 
                  onClick={handleAiRequest}
                  disabled={loadingAi}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-bold transition-all border border-white/10"
                >
                  {loadingAi ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                  {loadingAi ? 'Thinking...' : 'Ask AI Context'}
                </button>
              </>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300 text-center">
                 <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={20} className="text-yellow-300" />
                 </div>
                 <p className="text-white text-lg font-medium leading-relaxed mb-4">"{aiContext}"</p>
                 <button 
                  onClick={(e) => { e.stopPropagation(); setAiContext(null); }}
                  className="text-xs text-blue-200 hover:text-white underline"
                 >
                    Show Translation
                 </button>
              </div>
            )}

             <button 
              onClick={(e) => { e.stopPropagation(); speak(translationText, 'en-US'); }}
              className="absolute top-6 right-6 p-2 bg-black/20 rounded-full hover:bg-white/20 text-white/70 transition-colors"
            >
              <Volume2 size={18} />
            </button>

          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-8 mt-10">
        <button onClick={handlePrev} className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all">
          <ChevronLeft size={32} />
        </button>
        <button onClick={handleNext} className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-cyan-500/20">
          <ChevronRight size={32} />
        </button>
      </div>

    </div>
  );
}

// ==========================================
// 3. QUIZ SESSION
// ==========================================
function QuizSession({
  words = [],
  addXP,
  onComplete,
  updateMastery,
  isTypingMode = false,
  targetLanguage = 'es-ES',
  onDone,
}) {
  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState([]); 
  const [typingValue, setTypingValue] = useState('');
  const [finished, setFinished] = useState(false);
  
  // FIX: Helper to shuffle
  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  useEffect(() => {
    if (!words || words.length === 0) return;
    const arr = shuffleArray(words.slice(0, Math.max(4, Math.min(words.length, 12))));
    setOrder(arr);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setShowFeedback(false);
    setResults([]);
    setTypingValue('');
    setFinished(false);
  }, [words, isTypingMode]);

  useEffect(() => {
    if (!finished) return;
    const totalXP = score * XP_REWARDS.quiz_correct + (score === order.length ? XP_REWARDS.quiz_perfect_bonus : 0);
    safeCall(addXP, totalXP);
    safeCall(onComplete); // Tracks the usage limit
  }, [finished]);

  // FIX: Guard against crash if order isn't ready
  if (!order || order.length === 0) {
    return <div className="text-center text-slate-400">Not enough words for a quiz.</div>;
  }
  
  const current = order[index];
  // Guard against crash if current undefined
  if(!current) return <div className="text-center"><Loader2 className="animate-spin"/></div>;

  const correctAnswer = getWordContent(current);

  const getChoices = () => {
    if (!current || !words || words.length === 0) return [];
    const other = shuffleArray(words.filter(w => w.id !== current.id)).slice(0, 3);
    const choices = [correctAnswer, ...other.map(w => getWordContent(w))];
    return shuffleArray(choices);
  };

  const [choices, setChoices] = useState([]);

  useEffect(() => {
    if (!isTypingMode && current) setChoices(getChoices());
    setSelected(null);
    setShowFeedback(false);
    setTypingValue('');
  }, [index, isTypingMode, current]);

  const recordResultAndContinue = (selectedAnswer, correct) => {
    setResults(r => [...r, { id: current.id, term: current.term, correctAnswer, selectedAnswer, correct }]);
    setTimeout(() => {
      if (index + 1 >= order.length) {
        setFinished(true);
      } else {
        setIndex(i => i + 1);
      }
    }, 1000);
  };

  const handleChoice = (choice) => {
    if (showFeedback) return;
    setSelected(choice);
    const correct = choice === correctAnswer;
    setShowFeedback(true);
    if (correct) {
      setScore(s => s + 1);
      safeCall(updateMastery, current.id, 1);
    } else {
      safeCall(updateMastery, current.id, -1);
    }
    recordResultAndContinue(choice, correct);
  };

  if (finished) {
    const totalXP = score * XP_REWARDS.quiz_correct;
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Quiz Complete</h2>
          <p className="text-slate-400">You scored {score} / {order.length}</p>
          <div className="mt-3 inline-flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-amber-400 text-slate-900 font-bold shadow">+{totalXP} XP</div>
            <button onClick={() => safeCall(onDone)} className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold">Back to Menu</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Quiz</h2>
          <p className="text-slate-400 text-sm">Question {index + 1} / {order.length}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase">Score</div>
          <div className="text-lg font-bold text-white">{score}</div>
        </div>
      </div>

      <div className="bg-[#061025] border border-slate-800 rounded-2xl p-6 mb-4">
        <div className="text-slate-300 text-sm mb-2">Translate</div>
        <div className="text-xl font-bold text-white">{current.term}</div>
      </div>

      {!isTypingMode ? (
        <div className="grid grid-cols-1 gap-3">
          {choices.map((c, i) => {
            const isSelected = selected === c;
            const correct = c === correctAnswer;
            const showCorrectState = showFeedback && (isSelected || correct);
            let bgClass = 'bg-[#0f172a] border-slate-800 text-white hover:bg-slate-800';
            
            if (showFeedback) {
                if (correct) bgClass = 'bg-green-600/10 border-green-500 text-green-300';
                else if (isSelected) bgClass = 'bg-rose-600/10 border-rose-500 text-rose-300';
            }

            return (
              <button
                key={i}
                disabled={showFeedback}
                onClick={() => handleChoice(c)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${bgClass}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-slate-400 text-center">Typing mode enabled (placeholder for brevity)</div>
      )}
    </div>
  );
}

// ==========================================
// 4. MATCH SESSION
// ==========================================
function MatchSession({ words = [], addXP, onComplete, updateMastery, onDone, targetLanguage }) {
   const [pairs, setPairs] = useState([]); 
   const [left, setLeft] = useState([]); 
   const [right, setRight] = useState([]); 
   const [selectedLeft, setSelectedLeft] = useState(null);
   const [selectedRight, setSelectedRight] = useState(null);
   const [matchedIds, setMatchedIds] = useState(new Set());
   const [score, setScore] = useState(0);
   const [done, setDone] = useState(false);

   // FIX: Helper inside component
   function shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

   useEffect(() => {
     if(!words.length) return;
     const sample = words.slice(0, Math.min(words.length, 6)).map(w => ({
       id: w.id,
       term: w.term,
       translation: getWordContent(w)
     }));
     const shuffledRight = shuffleArray(sample.map(s => ({ id: s.id, text: s.translation })));
     setPairs(sample);
     setLeft(sample.map(s => ({ id: s.id, text: s.term })));
     setRight(shuffledRight);
     setMatchedIds(new Set());
     setScore(0);
     setDone(false);
   }, [words]);

   useEffect(() => {
     if (pairs.length > 0 && matchedIds.size === pairs.length) {
       setDone(true);
       safeCall(addXP, score * XP_REWARDS.match_correct);
       safeCall(onComplete); // Trigger Limit
     }
   }, [matchedIds]);

   const handleSelectLeft = (item) => {
     if (matchedIds.has(item.id)) return;
     setSelectedLeft(item);
     if (selectedRight) attemptMatch(item, selectedRight);
   };

   const handleSelectRight = (item) => {
     if (matchedIds.has(item.id)) return;
     setSelectedRight(item);
     if (selectedLeft) attemptMatch(selectedLeft, item);
   };

   const attemptMatch = (l, r) => {
     if (l.id === r.id) {
       setMatchedIds(prev => new Set(prev).add(l.id));
       setScore(s => s + 1);
       safeCall(updateMastery, l.id, 1);
       setSelectedLeft(null);
       setSelectedRight(null);
     } else {
       safeCall(updateMastery, l.id, -1);
       setTimeout(() => {
         setSelectedLeft(null);
         setSelectedRight(null);
       }, 500);
     }
   };

   // Crash fix
   if (!pairs || pairs.length === 0) return <div className="text-center text-slate-400">Not enough words.</div>;

   return (
     <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Match</h2>
          <p className="text-slate-400 text-sm">Tap a term and its translation to pair them.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase">Score</div>
          <div className="text-lg font-bold text-white">{score} / {pairs.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          {left.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedLeft?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectLeft(item)}
                disabled={isMatched}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isMatched ? 'bg-green-500/10 border-green-500 text-green-300' :
                  isSelected ? 'bg-yellow-500/10 border-yellow-500 text-yellow-300' :
                  'bg-[#0f172a] border-slate-800 text-white hover:bg-slate-800'
                }`}
              >
                {item.text}
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          {right.map(item => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedRight?.id === item.id;
            return (
              <button
                key={item.id + '-r'}
                onClick={() => handleSelectRight(item)}
                disabled={isMatched}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isMatched ? 'bg-green-500/10 border-green-500 text-green-300' :
                  isSelected ? 'bg-yellow-500/10 border-yellow-500 text-yellow-300' :
                  'bg-[#0f172a] border-slate-800 text-white hover:bg-slate-800'
                }`}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {done && (
        <div className="mt-8 text-center animate-in fade-in zoom-in">
          <div className="inline-block bg-gradient-to-tr from-green-400 to-teal-400 text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-lg">
            Completed • +{score * XP_REWARDS.match_correct} XP
          </div>
          <div className="mt-4">
            <button onClick={() => safeCall(onDone)} className="mt-4 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold">Back to Menu</button>
          </div>
        </div>
      )}
    </div>
   );
}