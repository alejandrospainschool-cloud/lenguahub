import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Keyboard,
  Bot,
  Loader2,
  CheckCircle2,
  XCircle,
  MousePointer2
} from 'lucide-react';

// --- CONSTANTS & CONFIG ---
const FREE_LIMITS = {
  flashcards: 20,
  quizzes: 3,
  matches: 10, // NEW: free limit for Match mode
};

const XP_REWARDS = {
  quiz_correct: 10,
  quiz_perfect_bonus: 50,
  flashcard_flip: 1,
  typing_bonus: 5, // Extra XP for typing mode
  match_correct: 8, // NEW: XP for each correct match
};

// --- HELPER: SAFE TEXT CONTENT ---
const getWordContent = (word) => {
  if (!word) return '';
  return word.translation || word.definition || word.meaning || word.answer || 'No Translation';
};

// --- HELPER: TEXT-TO-SPEECH ---
const speak = (text, lang = 'en-US') => {
  if (!window.speechSynthesis) return;
  // Cancel previous speech to avoid overlapping
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; 
  utterance.rate = 0.8; // Slightly slower for clear pronunciation
  
  // Optional: Select a specific voice if available
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(lang));
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
};

// --- HELPER: AI GENERATION ---
const generateAIContext = async (term, translation) => {
  const apiKey = ""; // Injected by environment
  const prompt = `Give me a simple, short example sentence in the target language using the word "${term}" (meaning: ${translation}). Then provide the English translation of that sentence. Format: "Sentence. (Translation)"`;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate example.";
  } catch (error) {
    console.error("AI Error:", error);
    return "AI Unavailable. Check connection.";
  }
};

export default function Study({ words = [], userXP = 0, onUpdateXP, targetLanguage = 'es-ES' }) {
  const [mode, setMode] = useState('menu'); // 'menu', 'flashcards', 'quiz'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sessionXP, setSessionXP] = useState(0);
  
  // Advanced Options State
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [isSmartReview, setIsSmartReview] = useState(false);

  // Persistence: Usage Limits & Mastery Scores (SRS)
  const [storageData, setStorageData] = useState(() => {
    try {
      const saved = localStorage.getItem('study_data');
      const today = new Date().toDateString();
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset limits if new day, keep mastery scores
        if (parsed.date !== today) {
          return { ...parsed, date: today, usage: { flashcards: 0, quizzes: 0, matches: 0 } };
        }
        return parsed;
      }
    } catch (e) { console.error(e); }
    return { 
      date: new Date().toDateString(), 
      usage: { flashcards: 0, quizzes: 0, matches: 0 }, // include matches
      mastery: {} // { wordId: score } (High score = known well, Low = needs review)
    };
  });

  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    localStorage.setItem('study_data', JSON.stringify(storageData));
  }, [storageData]);

  // --- FILTERING LOGIC ---
  const categories = useMemo(() => {
    const cats = new Set(words.map(w => w.category || 'Uncategorized'));
    return ['All', ...Array.from(cats)];
  }, [words]);

  const activeWords = useMemo(() => {
    let filtered = words;
    
    // 1. Filter by Category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(w => (w.category || 'Uncategorized') === selectedCategory);
    }

    // 2. Filter by Smart Review (SRS)
    // Prioritize words with Mastery score < 3
    if (isSmartReview) {
      filtered = [...filtered].sort((a, b) => {
        const scoreA = storageData.mastery[a.id] || 0;
        const scoreB = storageData.mastery[b.id] || 0;
        return scoreA - scoreB; // Ascending: Lowest mastery first
      });
      // Optional: limit to top 20 weakest words
      filtered = filtered.slice(0, 20);
    } else {
      // Default: Randomize slightly to keep it fresh
      // Using a simple pseudo-random sort for stability during re-renders would be better,
      // but for this demo, we'll keep order or standard sort.
    }

    return filtered;
  }, [words, selectedCategory, isSmartReview, storageData.mastery]);

  // --- ACTIONS ---
  const handleAddXP = (amount) => {
    setSessionXP(prev => prev + amount);
    if (onUpdateXP) onUpdateXP(amount);
  };

  const updateMastery = (wordId, change) => {
    setStorageData(prev => ({
      ...prev,
      mastery: {
        ...prev.mastery,
        [wordId]: Math.max(0, (prev.mastery[wordId] || 0) + change)
      }
    }));
  };

  const checkLimit = (type) => {
    if (storageData.usage[type] >= FREE_LIMITS[type]) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const incrementUsage = (type) => {
    setStorageData(prev => ({
      ...prev,
      usage: {
        ...prev.usage,
        [type]: prev.usage[type] + 1
      }
    }));
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

      {/* --- VIEW ROUTER --- */}
      {mode === 'menu' && (
        <StudyMenu 
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          setMode={setMode} 
          wordCount={activeWords.length}
          usage={storageData.usage}
          checkLimit={checkLimit}
          // New Props
          isTypingMode={isTypingMode}
          setIsTypingMode={setIsTypingMode}
          isSmartReview={isSmartReview}
          setIsSmartReview={setIsSmartReview}
          setShowPaywall={setShowPaywall} // NEW: for upgrade promo
        />
      )}

      {mode === 'flashcards' && (
        <FlashcardSession 
          words={activeWords} 
          addXP={handleAddXP} 
          incrementUsage={() => incrementUsage('flashcards')}
          usage={storageData.usage}
          checkLimit={() => checkLimit('flashcards')}
          targetLanguage={targetLanguage}
        />
      )}

      {mode === 'quiz' && (
        <QuizSession 
          words={activeWords} 
          addXP={handleAddXP}
          onComplete={() => incrementUsage('quizzes')}
          updateMastery={updateMastery}
          isTypingMode={isTypingMode}
          targetLanguage={targetLanguage}
        />
      )}

      {mode === 'match' && (
        <MatchSession 
          words={activeWords} 
          addXP={handleAddXP}
          onComplete={() => incrementUsage('matches')}
          updateMastery={updateMastery}
          checkLimit={() => checkLimit('matches')}
          targetLanguage={targetLanguage}
        />
      )}

      {/* --- PAYWALL MODAL --- */}
      {showPaywall && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20">
              <Crown size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Unlock Unlimited</h2>
            <p className="text-slate-400 mb-8">
              You've hit your daily limit. Upgrade to Pro to continue learning without boundaries.
            </p>
            <button onClick={() => setShowPaywall(false)} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl mb-3">
              Get Pro for $4.99
            </button>
            <button onClick={() => setShowPaywall(false)} className="w-full py-3 text-slate-500 hover:text-white font-medium">
              Maybe later
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 1. MENU COMPONENT (Enhanced)
// ==========================================
function StudyMenu({ 
  categories, selectedCategory, setSelectedCategory, 
  setMode, wordCount, usage, checkLimit,
  isTypingMode, setIsTypingMode,
  isSmartReview, setIsSmartReview,
  setShowPaywall // NEW
}) {
  
  const handleModeSelect = (modeType) => {
    const limitMap = { flashcards: 'flashcards', quiz: 'quizzes', match: 'matches' };
    const limitType = limitMap[modeType] || 'flashcards';
    if (checkLimit(limitType)) {
      setMode(modeType);
    }
  };

  const getLimitProgress = (current, max) => Math.min(100, (current / max) * 100);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* FOLDER / CATEGORY SELECTOR */}
      <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-400 uppercase tracking-widest text-xs font-bold">
            <Filter size={14} />
            <span>Study Filters</span>
          </div>
          
          {/* Enhanced Smart Review Toggle */}
          <button 
            onClick={() => setIsSmartReview(!isSmartReview)}
            className={`group flex items-center gap-3 pl-3 pr-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              isSmartReview 
                ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSmartReview ? 'bg-orange-500 text-white' : 'bg-slate-600 group-hover:bg-slate-500 text-slate-300'}`}>
              <Brain size={14} />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className={`block mb-0.5 ${isSmartReview ? 'text-orange-400' : 'text-slate-300'}`}>Smart Review</span>
              <span className="opacity-60 font-normal">{isSmartReview ? 'On' : 'Off'}</span>
            </div>
          </button>
        </div>

        {/* UPGRADE PROMO */}
        <div className="mb-4 rounded-2xl overflow-hidden border border-yellow-600/10 bg-gradient-to-r from-yellow-400/5 to-orange-400/5 p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-yellow-300">Upgrade to Pro</div>
            <div className="text-slate-300 text-sm">Unlimited practice, smart review tuning, and more.</div>
          </div>
          <div>
            <button
              onClick={() => setShowPaywall(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold shadow-lg"
            >
              Learn More
            </button>
          </div>
        </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* changed to 3 columns */}
        
        {/* Flashcards Option */}
        <button
          onClick={() => handleModeSelect('flashcards')}
          disabled={wordCount === 0}
          className="group relative bg-[#0f172a] border border-slate-800 hover:border-cyan-500/50 rounded-[32px] p-8 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Layers size={32} />
            </div>
            {/* Usage Indicator */}
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-500 mb-1">DAILY LIMIT</span>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                 {usage.flashcards >= FREE_LIMITS.flashcards && <Lock size={14} className="text-orange-500" />}
                 <span>{usage.flashcards}/{FREE_LIMITS.flashcards}</span>
              </div>
              <div className="w-20 h-1 bg-slate-800 rounded-full mt-2">
                <div 
                  className={`h-full rounded-full ${usage.flashcards >= FREE_LIMITS.flashcards ? 'bg-orange-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${getLimitProgress(usage.flashcards, FREE_LIMITS.flashcards)}%` }}
                />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Flashcards</h2>
          <p className="text-slate-400">Flip cards with AI & Audio support.</p>
        </button>

        {/* Quiz Option */}
        <div className="relative group">
          <button 
            onClick={() => handleModeSelect('quiz')}
            disabled={wordCount < 4}
            className="w-full h-full relative bg-[#0f172a] border border-slate-800 hover:border-purple-500/50 rounded-[32px] p-8 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden z-10"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Brain size={32} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-500 mb-1">DAILY LIMIT</span>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  {usage.quizzes >= FREE_LIMITS.quizzes && <Lock size={14} className="text-orange-500" />}
                  <span>{usage.quizzes}/{FREE_LIMITS.quizzes}</span>
                </div>
                <div className="w-20 h-1 bg-slate-800 rounded-full mt-2">
                  <div 
                    className={`h-full rounded-full ${usage.quizzes >= FREE_LIMITS.quizzes ? 'bg-orange-500' : 'bg-purple-500'}`} 
                    style={{ width: `${getLimitProgress(usage.quizzes, FREE_LIMITS.quizzes)}%` }}
                  />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Quiz Mode</h2>
            <p className="text-slate-400 mb-4">Test your knowledge.</p>
          </button>
        </div>

        {/* NEW: Match Option */}
        <div className="relative group">
          <button 
            onClick={() => handleModeSelect('match')}
            disabled={wordCount < 2}
            className="w-full h-full relative bg-[#0f172a] border border-slate-800 hover:border-green-500/50 rounded-[32px] p-8 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden z-10"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={32} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-500 mb-1">DAILY LIMIT</span>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  {usage.matches >= FREE_LIMITS.matches && <Lock size={14} className="text-orange-500" />}
                  <span>{usage.matches}/{FREE_LIMITS.matches}</span>
                </div>
                <div className="w-20 h-1 bg-slate-800 rounded-full mt-2">
                  <div 
                    className={`h-full rounded-full ${usage.matches >= FREE_LIMITS.matches ? 'bg-orange-500' : 'bg-green-500'}`} 
                    style={{ width: `${getLimitProgress(usage.matches, FREE_LIMITS.matches)}%` }}
                  />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Match</h2>
            <p className="text-slate-400">Match terms to their translations.</p>
          </button>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 2. FLASHCARD SESSION (Enhanced with AI & TTS)
// ==========================================
function FlashcardSession({ words, addXP, incrementUsage, usage, checkLimit, targetLanguage }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // AI State
  const [aiContext, setAiContext] = useState(null); // null | string
  const [loadingAi, setLoadingAi] = useState(false);

  if (!words || words.length === 0) return <div>No cards available</div>;
  const currentWord = words[index];

  // Reset AI context when card changes
  useEffect(() => {
    setAiContext(null);
    setLoadingAi(false);
  }, [index]);

  const handleNext = () => {
    if (!checkLimit()) return;
    setIsFlipped(false);
    incrementUsage();
    addXP(XP_REWARDS.flashcard_flip);
    setTimeout(() => setIndex((prev) => (prev + 1) % words.length), 300);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setIndex((prev) => (prev - 1 + words.length) % words.length), 300);
  };

  const handleAiRequest = async (e) => {
    e.stopPropagation(); // Don't flip card
    if (aiContext) return; // Already loaded
    
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
          <Zap size={14} /> Today: {usage.flashcards}
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
            
            {/* Audio Button - Uses Target Language */}
            <button 
              onClick={(e) => { e.stopPropagation(); speak(currentWord.term, targetLanguage); }}
              className="mt-6 p-3 bg-slate-800 rounded-full hover:bg-cyan-500 hover:text-white text-slate-400 transition-colors"
              title="Pronounce"
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
                
                {/* AI Button */}
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

            {/* Audio Button (Translation) - Uses Default (English) */}
             <button 
              onClick={(e) => { e.stopPropagation(); speak(translationText, 'en-US'); }}
              className="absolute top-6 right-6 p-2 bg-black/20 rounded-full hover:bg-white/20 text-white/70 transition-colors"
              title="Pronounce Translation"
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
// 3. QUIZ SESSION (Enhanced with Typing Mode)
// ==========================================
function QuizSession({ words, addXP, onComplete, updateMastery, isTypingMode, targetLanguage }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // Multiple Choice State
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  // Typing Mode State
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typingFeedback, setTypingFeedback] = useState(null); // 'correct' | 'incorrect' | null

  // Generate question
  useEffect(() => {
    if (currentQ >= words.length) {
      setShowResult(true);
      onComplete();
      return;
    }

    const correct = words[currentQ];
    
    if (!isTypingMode) {
      const wrong = words
        .filter(w => w.id !== correct.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setOptions([correct, ...wrong].sort(() => 0.5 - Math.random()));
      setSelectedOption(null);
    } else {
      setTypedAnswer('');
      setTypingFeedback(null);
    }

  }, [currentQ, words, isTypingMode]);

  const handleMultipleChoice = (option) => {
    if (selectedOption) return;
    setSelectedOption(option);

    const isCorrect = option.id === words[currentQ].id;
    if (isCorrect) {
      setScore(s => s + 1);
      addXP(XP_REWARDS.quiz_correct);
      updateMastery(words[currentQ].id, 1); // Increase mastery
    } else {
      updateMastery(words[currentQ].id, -1); // Decrease mastery
    }

    setTimeout(() => setCurrentQ(prev => prev + 1), 1200);
  };

  const handleTypingSubmit = (e) => {
    e.preventDefault();
    if (typingFeedback) return;

    const correctTranslation = getWordContent(words[currentQ]).toLowerCase().trim();
    const userAns = typedAnswer.toLowerCase().trim();
    const isCorrect = userAns === correctTranslation;

    setTypingFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setScore(s => s + 1);
      addXP(XP_REWARDS.quiz_correct + XP_REWARDS.typing_bonus); // Bonus for hard mode
      updateMastery(words[currentQ].id, 2); // Double mastery boost for typing
      speak("Correct!", 'en-US');
    } else {
      updateMastery(words[currentQ].id, -1);
      speak("Incorrect", 'en-US');
    }

    setTimeout(() => setCurrentQ(prev => prev + 1), 2000); // Longer delay to read feedback
  };

  if (showResult) {
    return <QuizResult words={words} score={score} addXP={addXP} />;
  }

  const currentWord = words[currentQ];
  if (!currentWord) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      
      {/* Progress & Header */}
      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
        <span>Progress</span>
        <span>{Math.round(((currentQ) / words.length) * 100)}%</span>
      </div>
      <div className="w-full h-3 bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentQ) / words.length) * 100}%` }}
        />
      </div>

      <div className="text-center mb-10 relative">
        <span className="text-slate-500 font-bold tracking-widest text-sm uppercase mb-4 block">Translate this</span>
        <h2 className="text-5xl font-bold text-white break-words px-4 mb-4">{currentWord.term}</h2>
        {/* Speak Question Term Button */}
        <button 
           onClick={() => speak(currentWord.term, targetLanguage)}
           className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 mx-auto transition-colors"
           title="Hear Word"
        >
           <Volume2 size={20} />
        </button>

        {isTypingMode && (
           <div className="flex justify-center mt-4">
             <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold border border-purple-500/30 flex items-center gap-2">
               <Keyboard size={12} /> Typing Mode (+5 XP)
             </span>
           </div>
        )}
      </div>

      {/* --- TYPING MODE UI --- */}
      {isTypingMode ? (
        <form onSubmit={handleTypingSubmit} className="max-w-md mx-auto relative">
          <input
            type="text"
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            disabled={!!typingFeedback}
            placeholder="Type meaning here..."
            className={`w-full p-6 text-xl text-center rounded-2xl bg-[#1e293b] border-2 outline-none transition-all ${
              typingFeedback === 'correct' ? 'border-green-500 text-green-400 bg-green-500/10' :
              typingFeedback === 'incorrect' ? 'border-red-500 text-red-400 bg-red-500/10' :
              'border-slate-700 focus:border-purple-500 text-white'
            }`}
            autoFocus
          />
          
          {/* Feedback Overlay */}
          {typingFeedback === 'incorrect' && (
             <div className="absolute -bottom-16 left-0 w-full text-center animate-in fade-in slide-in-from-top-2">
               <div className="inline-block bg-red-500/20 text-red-400 px-4 py-2 rounded-xl border border-red-500/50">
                 Answer: <strong>{getWordContent(currentWord)}</strong>
               </div>
             </div>
          )}

          {!typingFeedback && (
            <button 
              type="submit" 
              className="mt-6 w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
            >
              Check Answer
            </button>
          )}
        </form>
      ) : (
        /* --- MULTIPLE CHOICE UI --- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => {
            let btnStyle = "bg-[#1e293b] border-slate-700 hover:border-purple-500 hover:bg-slate-800";
            let icon = null;
            
            if (selectedOption) {
              if (option.id === currentWord.id) {
                btnStyle = "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]";
                icon = <CheckCircle2 size={20} className="animate-bounce" />;
              } else if (option.id === selectedOption.id) {
                btnStyle = "bg-red-500/20 border-red-500 text-red-400"; 
                icon = <XCircle size={20} />;
              } else {
                btnStyle = "opacity-30 bg-[#1e293b] border-slate-800 scale-95 grayscale";
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleMultipleChoice(option)}
                disabled={!!selectedOption}
                className={`relative p-6 rounded-2xl border-2 font-bold text-lg transition-all duration-300 flex items-center justify-between group ${btnStyle} text-white min-h-[100px]`}
              >
                <span className="break-words w-full text-left">{getWordContent(option)}</span>
                {icon}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}

// Result Component
function QuizResult({ words, score, addXP }) {
  useEffect(() => {
    if (score === words.length) {
      addXP(XP_REWARDS.quiz_perfect_bonus);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 bg-[#0f172a] rounded-[40px] border border-slate-800 animate-in zoom-in-95 duration-300">
      <div className="w-32 h-32 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-purple-500/30">
        {score === words.length ? <Trophy size={64} className="text-yellow-200 animate-bounce" /> : <Brain size={64} className="text-white" />}
      </div>
      
      <h2 className="text-4xl font-bold text-white mb-2">
        {score === words.length ? 'Perfect Score!' : 'Quiz Complete!'}
      </h2>
      
      <p className="text-slate-400 text-lg mb-8">
        You scored <span className="text-purple-400 font-bold">{score} / {words.length}</span>
      </p>

      {/* XP Summary */}
      <div className="flex gap-4 mb-8">
        <div className="bg-slate-800 rounded-2xl p-4 text-center min-w-[100px]">
          <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Base XP</span>
          <span className="text-xl font-bold text-white">+{score * XP_REWARDS.quiz_correct}</span>
        </div>
        {score === words.length && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-2xl p-4 text-center min-w-[100px]">
            <span className="text-xs text-yellow-500 uppercase font-bold block mb-1">Bonus</span>
            <span className="text-xl font-bold text-yellow-400">+{XP_REWARDS.quiz_perfect_bonus}</span>
          </div>
        )}
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition"
      >
        Back to Menu
      </button>
    </div>
  );
}

// ==========================================
// 4. MATCH SESSION (NEW)
// ==========================================
function MatchSession({ words = [], addXP, onComplete, updateMastery, checkLimit }) {
  const [pairs, setPairs] = useState([]); // [{id, term, translation}]
  const [left, setLeft] = useState([]); // terms
  const [right, setRight] = useState([]); // translations (shuffled)
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Prepare a small set for a match session (up to 6 pairs)
    const sample = words.slice(0, Math.min(words.length, 6)).map(w => ({
      id: w.id,
      term: w.term,
      translation: getWordContent(w)
    }));
    const shuffledRight = shuffleArray(sample.map(s => ({ id: s.id, text: s.translation })));
    setPairs(sample);
    setLeft(sample.map(s => ({ id: s.id, text: s.term })));
    setRight(shuffledRight);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedIds(new Set());
    setScore(0);
    setDone(false);
  }, [words]);

  useEffect(() => {
    if (pairs.length > 0 && matchedIds.size === pairs.length) {
      // Completed
      setDone(true);
      addXP(score * XP_REWARDS.match_correct);
      if (onComplete) onComplete();
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
    if (!l || !r) return;
    if (l.id === r.id) {
      // correct
      setMatchedIds(prev => new Set(prev).add(l.id));
      setScore(s => s + 1);
      updateMastery?.(l.id, 1);
      // clear selections
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // incorrect
      updateMastery?.(l.id, -1);
      // brief feedback: clear selections after small delay
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 700);
    }
  };

  if (!pairs || pairs.length === 0) return <div className="text-center text-slate-400">Not enough words to match.</div>;

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
        <div className="mt-8 text-center">
          <div className="inline-block bg-gradient-to-tr from-green-400 to-teal-400 text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-lg">
            Completed • +{score * XP_REWARDS.match_correct} XP
          </div>
          <div className="mt-4">
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold">Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: shuffle array
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}