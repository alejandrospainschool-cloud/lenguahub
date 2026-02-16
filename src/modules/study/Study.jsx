// src/modules/study/Study.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Brain, RotateCw, ArrowLeft, ChevronRight, Layers, 
  Filter, Lock, Trophy, Sparkles, Zap, Crown, Volume2, 
  Loader2, CheckCircle2, XCircle, Timer, MoveRight
} from 'lucide-react';
import { hasReachedLimit, FREEMIUM_LIMITS } from '../../lib/freemium';
import ConfettiEffect from '../../components/animations/ConfettiEffect';
import AnimatedToast from '../../components/animations/AnimatedToast';
import { getCelebrationMessages } from '../../lib/animationHelpers';

// --- HELPERS ---
const getWordContent = (word) => word?.translation || word?.definition || 'No Content';

const speak = (text, lang = 'es-ES') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; 
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
};

// Safe Shuffle
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function Study({ 
  words = [], targetLanguage = 'es-ES',
  isPremium, dailyUsage, trackUsage, onUpgrade
}) {
  const [mode, setMode] = useState('menu');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [wordSource, setWordSource] = useState('category'); // 'category' or 'recent'
  const [questionCount, setQuestionCount] = useState(5);
  const [sessionXP, setSessionXP] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // --- FILTER LOGIC ---
  const categories = useMemo(() => {
    const cats = new Set(words.map(w => w.category || 'Uncategorized'));
    return ['All', ...Array.from(cats)].sort();
  }, [words]);

  const getRecentWords = useMemo(() => {
    const sorted = [...words].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return sorted.slice(0, Math.min(20, sorted.length));
  }, [words]);

  const activeWords = useMemo(() => {
    let filtered = wordSource === 'recent' ? getRecentWords : words;
    
    if (wordSource !== 'recent' && selectedCategory !== 'All') {
      filtered = filtered.filter(w => (w.category || 'Uncategorized') === selectedCategory);
    }
    
    return filtered;
  }, [words, selectedCategory, wordSource, getRecentWords]);

  // --- ACTIONS ---
  const handleModeSelect = (targetMode) => {
    if (activeWords.length === 0) {
      alert("No words available. Add some words first!");
      return;
    }

    // For difficulty modes, need minimum words
    const minWords = selectedDifficulty === 'hard' ? 3 : selectedDifficulty === 'insane' ? 5 : 1;
    if (activeWords.length < minWords) {
      alert(`This difficulty needs at least ${minWords} words.`);
      return;
    }

    // Check entry limits for Quiz and Match
    const limitMap = { 'quiz': 'quizzesPlayed', 'match': 'matchesPlayed' };
    if (limitMap[targetMode]) {
       if (hasReachedLimit(dailyUsage, limitMap[targetMode], isPremium)) {
          setShowPaywall(true);
          return;
       }
    }
    
    setMode(targetMode);
  };

  const handleSessionComplete = (type) => {
    const limitMap = { 'quiz': 'quizzesPlayed', 'match': 'matchesPlayed' };
    if (limitMap[type]) trackUsage(limitMap[type]);
    // Trigger celebration animations
    setShowConfetti(true);
    setToastMessage(getCelebrationMessages());
    setShowToast(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 min-h-[800px] relative">
      <ConfettiEffect trigger={showConfetti} />
      <AnimatedToast
        message={toastMessage}
        type="achievement"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-6 px-4">
        <div className="flex items-center gap-4">
          {mode !== 'menu' && (
            <button 
              onClick={() => setMode('menu')} 
              className="p-3 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Brain className="text-indigo-500" size={32} />
              Study Room
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'menu' 
                ? 'Master your vocabulary with AI-powered tools' 
                : <span className="flex items-center gap-2">Studying <span className="text-indigo-400 font-bold">{activeWords.length} words</span> in {selectedCategory}</span>
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-full px-5 py-2 shadow-lg">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <Trophy size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session XP</span>
              <span className="text-xl font-bold text-white leading-none">+{sessionXP}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MENU MODE --- */}
      {mode === 'menu' && (
        <StudyMenu 
          categories={categories} 
          selectedCategory={selectedCategory} 
          setSelectedCategory={setSelectedCategory}
          wordSource={wordSource}
          setWordSource={setWordSource}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          activeWords={activeWords}
          dailyUsage={dailyUsage}
          isPremium={isPremium}
          onSelectMode={handleModeSelect}
        />
      )}

      {/* --- FLASHCARDS MODE --- */}
      {mode === 'flashcards' && (
        <FlashcardSession 
          words={activeWords} 
          difficulty={selectedDifficulty}
          addXP={(v) => setSessionXP(p => p + v)} 
          onUsage={() => trackUsage('flashcardsViewed')}
          checkLimit={() => hasReachedLimit(dailyUsage, 'flashcardsViewed', isPremium)}
          triggerPaywall={() => setShowPaywall(true)}
          targetLanguage={targetLanguage}
          usageCount={dailyUsage.flashcardsViewed}
          onExit={() => setMode('menu')}
        />
      )}

      {/* --- QUIZ MODE --- */}
      {mode === 'quiz' && (
        <QuizSession 
          words={activeWords} 
          difficulty={selectedDifficulty}
          questionCount={questionCount}
          addXP={(v) => setSessionXP(p => p + v)}
          onComplete={() => handleSessionComplete('quiz')}
          onExit={() => setMode('menu')}
        />
      )}

      {/* --- MATCH MODE --- */}
      {mode === 'match' && (
        <MatchSession 
          words={activeWords} 
          difficulty={selectedDifficulty}
          addXP={(v) => setSessionXP(p => p + v)}
          onComplete={() => handleSessionComplete('match')}
          onExit={() => setMode('menu')}
        />
      )}

      {/* PAYWALL MODAL */}
      {showPaywall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
            
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-amber-500/50">
              <Crown size={40} className="text-amber-500" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              You've hit the free limit for this mode. Upgrade to Premium for unlimited learning and faster progress.
            </p>
            
            <button 
              onClick={() => { setShowPaywall(false); onUpgrade(); }} 
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl mb-4 shadow-lg shadow-orange-900/20 transition-all transform hover:scale-[1.02]"
            >
              Unlock Unlimited Access £9.99
            </button>
            <button onClick={() => setShowPaywall(false)} className="text-slate-500 hover:text-white text-sm font-medium transition-colors">
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function StudyMenu({ categories, selectedCategory, setSelectedCategory, wordSource, setWordSource, selectedDifficulty, setSelectedDifficulty, questionCount, setQuestionCount, activeWords, dailyUsage, isPremium, onSelectMode }) {
  const getProgress = (current, max) => Math.min(100, (current / max) * 100);

  const UsageBar = ({ current, max, colorClass }) => {
    if (isPremium) return <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-2"><Crown size={12}/> UNLIMITED</div>;
    const isFull = current >= max;
    return (
      <div className="w-full mt-3">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
          <span>DAILY LIMIT</span>
          <span className={isFull ? "text-red-400" : "text-slate-400"}>{current}/{max}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : colorClass}`} style={{ width: `${getProgress(current, max)}%` }} />
        </div>
      </div>
    );
  };

  const difficulties = [
    { id: 'easy', label: 'Easy', color: 'from-green-500 to-emerald-600', desc: 'No pressure, relaxed learning' },
    { id: 'normal', label: 'Normal', color: 'from-blue-500 to-indigo-600', desc: '2x XP, 10s/question' },
    { id: 'hard', label: 'Hard', color: 'from-orange-500 to-red-600', desc: 'Timed: 7s/q, 3x XP' },
    { id: 'insane', label: 'Insane', color: 'from-purple-600 to-pink-600', desc: '⚡ 4s/q, 5x XP' }
  ];

  return (
    <div className="px-4 animate-in slide-in-from-bottom-4 duration-500">
      {/* Word Source Selection */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Study Mode</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setWordSource('category')}
            className={`px-4 py-3 rounded-xl font-semibold transition-all ${
              wordSource === 'category' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Layers size={16} className="inline mr-2" />
            By Folder
          </button>
          <button 
            onClick={() => setWordSource('recent')}
            className={`px-4 py-3 rounded-xl font-semibold transition-all ${
              wordSource === 'recent' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Sparkles size={16} className="inline mr-2" />
            Recent
          </button>
        </div>
      </div>

      {/* Category Selection */}
      {wordSource === 'category' && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Folder</h3>
          <div className="bg-[#1e293b]/50 border border-slate-800 p-2 rounded-2xl flex gap-2 overflow-x-auto mb-8 no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)} 
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty Selection */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Difficulty</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {difficulties.map(diff => {
            const isSelected = selectedDifficulty === diff.id;
            return (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`relative p-4 rounded-2xl transition-all duration-300 border-2 overflow-hidden group ${
                  isSelected 
                    ? `bg-gradient-to-br ${diff.color} border-white/50 shadow-lg` 
                    : 'bg-[#1e293b] border-slate-700 hover:border-slate-500 text-slate-400'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${diff.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative z-10">
                  <div className={`text-sm font-bold mb-1 ${isSelected ? 'text-white' : ''}`}>{diff.label}</div>
                  <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{diff.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Count Selection - Premium Only */}
      {isPremium && (
        <div className="mb-8 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Crown size={16} /> Premium: Question Count
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map(count => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  questionCount === count
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Study Modes */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Study Type</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Flashcards Card */}
        <button 
          onClick={() => onSelectMode('flashcards')}
          disabled={activeWords.length === 0}
          className="group relative bg-[#0f172a] border border-slate-800 p-6 rounded-3xl text-left hover:border-cyan-500/50 hover:bg-[#0f172a]/80 transition-all duration-300 disabled:opacity-50 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/10 transition-colors" />
          <div className="absolute top-6 right-6 p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform"><Layers size={24}/></div>
          <div className="mt-16 relative z-10">
            <h3 className="text-xl font-bold text-white mb-1">Flashcards</h3>
            <p className="text-sm text-slate-400">Review terms at your own pace.</p>
            <UsageBar current={dailyUsage.flashcardsViewed} max={FREEMIUM_LIMITS.flashcardsViewed} colorClass="bg-cyan-500" />
          </div>
        </button>

        {/* Quiz Card */}
        <button 
          onClick={() => onSelectMode('quiz')}
          disabled={activeWords.length < 2}
          className="group relative bg-[#0f172a] border border-slate-800 p-6 rounded-3xl text-left hover:border-purple-500/50 hover:bg-[#0f172a]/80 transition-all duration-300 disabled:opacity-50 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-500/10 transition-colors" />
          <div className="absolute top-6 right-6 p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform"><Brain size={24}/></div>
          <div className="mt-16 relative z-10">
            <h3 className="text-xl font-bold text-white mb-1">Quiz Mode</h3>
            <p className="text-sm text-slate-400">Multiple choice test with instant feedback.</p>
            <UsageBar current={dailyUsage.quizzesPlayed} max={FREEMIUM_LIMITS.quizzesPlayed} colorClass="bg-purple-500" />
          </div>
        </button>

        {/* Match Card */}
        <button 
          onClick={() => onSelectMode('match')}
          disabled={activeWords.length < 2}
          className="group relative bg-[#0f172a] border border-slate-800 p-6 rounded-3xl text-left hover:border-green-500/50 hover:bg-[#0f172a]/80 transition-all duration-300 disabled:opacity-50 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/10 transition-colors" />
          <div className="absolute top-6 right-6 p-3 bg-green-500/10 rounded-2xl text-green-400 group-hover:scale-110 transition-transform"><Zap size={24}/></div>
          <div className="mt-16 relative z-10">
            <h3 className="text-xl font-bold text-white mb-1">Speed Match</h3>
            <p className="text-sm text-slate-400">Link terms against the clock.</p>
            <UsageBar current={dailyUsage.matchesPlayed} max={FREEMIUM_LIMITS.matchesPlayed} colorClass="bg-green-500" />
          </div>
        </button>
      </div>
    </div>
  );
}

// ------------------- FLASHCARDS (LIMIT CHECK ON SWIPE) -------------------
function FlashcardSession({ words, difficulty = 'normal', addXP, onUsage, checkLimit, triggerPaywall, targetLanguage, usageCount, onExit }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  
  // XP Multipliers based on difficulty
  const difficultyMultiplier = {
    'easy': 1,
    'normal': 2,
    'hard': 3,
    'insane': 5
  }[difficulty] || 1;

  const baseXP = 5;
  const xpPerCard = baseXP * difficultyMultiplier;
  
  const currentWord = words && words.length > 0 ? words[index] : null;

  const handleNext = () => {
    if (checkLimit()) {
      triggerPaywall();
      return;
    }

    onUsage();
    addXP(xpPerCard);
    setSessionStats(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    setIsFlipped(false);
    
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 200);
  };

  if (!currentWord) return <div className="text-center text-slate-500 mt-20">No cards available</div>;

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto px-4">
      {/* Progress & Difficulty */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Card {index + 1} / {words.length}</span>
          <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((index + 1) / words.length) * 100}%` }} />
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
          difficulty === 'normal' ? 'bg-blue-500/20 text-blue-400' :
          difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {difficulty.toUpperCase()} • {xpPerCard} XP
        </div>
      </div>

      {/* Card Container */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)} 
        className="w-full aspect-[4/3] cursor-pointer perspective-1000 group relative mb-8"
      >
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT */}
          <div className="absolute inset-0 backface-hidden bg-[#1e293b] border border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl z-10 hover:border-indigo-500/50 transition-colors">
            <span className="text-indigo-400 text-xs font-bold uppercase mb-4 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">Term</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white text-center break-words">{currentWord.term}</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); speak(currentWord.term, targetLanguage); }} 
              className="mt-8 p-3 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-indigo-600 transition-all"
            >
              <Volume2 size={24} />
            </button>
            <div className="absolute bottom-6 text-slate-600 text-xs font-medium flex items-center gap-2">
              <RotateCw size={12} /> Click to flip
            </div>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl z-10 border border-white/10">
            <span className="text-blue-200 text-xs font-bold uppercase mb-4 tracking-widest bg-white/10 px-3 py-1 rounded-full">Definition</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center leading-relaxed">{getWordContent(currentWord)}</h2>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button 
          onClick={handleNext} 
          className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          Next Card <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ------------------- QUIZ SESSION -------------------
function QuizSession({ words, difficulty = 'normal', questionCount = 5, addXP, onComplete, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [answered, setAnswered] = useState(false);

  // Difficulty settings with updated timers
  const difficultyConfig = {
    'easy': { timePerQuestion: null, xpMultiplier: 1 },
    'normal': { timePerQuestion: 10, xpMultiplier: 2 },
    'hard': { timePerQuestion: 7, xpMultiplier: 3 },
    'insane': { timePerQuestion: 4, xpMultiplier: 5 }
  }[difficulty] || { timePerQuestion: 10, xpMultiplier: 2 };

  const baseXP = 10;
  const xpPerCorrect = baseXP * difficultyConfig.xpMultiplier;

  // Init Questions
  useEffect(() => {
    if (!words || words.length < 2) return;
    const shuffled = shuffleArray([...words]);
    const count = Math.min(questionCount, words.length);
    const q = shuffled.slice(0, count).map(target => {
       const others = words.filter(w => w.id !== target.id);
       const distractors = shuffleArray(others).slice(0, 3);
       const options = shuffleArray([target, ...distractors]).map(w => ({
         text: getWordContent(w),
         isCorrect: w.id === target.id
       }));
       return { target, options };
    });
    setQuestions(q);
    if (difficultyConfig.timePerQuestion) {
      setTimeRemaining(difficultyConfig.timePerQuestion);
    }
  }, [words, questionCount]);

  // Timer effect
  useEffect(() => {
    if (!difficultyConfig.timePerQuestion || timeRemaining === null || answered) return;
    
    const timer = setTimeout(() => {
      if (timeRemaining <= 1) {
        handleAnswer(null); // Auto-fail on timeout
      } else {
        setTimeRemaining(t => t - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, answered]);

  if (!words || words.length < 2) return <div className="text-center text-slate-500 mt-20">Need at least 2 words.</div>;
  if (questions.length === 0) return <div className="text-center mt-20"><Loader2 className="animate-spin text-indigo-500 mx-auto" /></div>;

  const currentQ = questions[idx];
  const isLast = idx === questions.length - 1;

  const handleAnswer = (option) => {
    if (answered) return;
    setAnswered(true);

    const isCorrect = option && option.isCorrect;
    setSelectedOption(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore(s => s + 1);
      speak(currentQ.target.term);
    }

    setTimeout(() => {
      if (!isLast) {
        setIdx(i => i + 1);
        setSelectedOption(null);
        setAnswered(false);
        if (difficultyConfig.timePerQuestion) {
          setTimeRemaining(difficultyConfig.timePerQuestion);
        }
      } else {
        setFinished(true);
        const finalScore = score + (isCorrect ? 1 : 0);
        addXP(finalScore * xpPerCorrect);
        onComplete();
      }
    }, 1200);
  };

  if (finished) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in duration-300">
      <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center text-slate-900 mb-6 shadow-xl shadow-yellow-500/20 animate-bounce" style={{ animationDuration: '1.5s' }}>
        <Trophy size={48} />
      </div>
      <h2 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h2>
      <p className="text-slate-400 mb-2 text-lg">You scored <span className="text-white font-bold">{score} / {questions.length}</span></p>
      <p className="text-indigo-400 font-bold text-lg mb-2">+{score * xpPerCorrect} XP</p>
      {score === questions.length && (
        <p className="text-yellow-300 font-bold text-sm mb-6 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/30 animate-pulse">
          ⭐ Perfect Score! ⭐
        </p>
      )}
      {score !== questions.length && <div className="mb-6" />}
      <button onClick={onExit} className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all hover:scale-105 active:scale-95">
        Back to Menu
      </button>
    </div>
  );

  const timerColor = timeRemaining === null ? 'text-slate-400' : timeRemaining > 10 ? 'text-blue-400' : timeRemaining > 5 ? 'text-orange-400' : 'text-red-400 animate-pulse';

  return (
    <div className="max-w-xl mx-auto px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Question {idx + 1} / {questions.length}</div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((idx) / questions.length) * 100}%` }} />
          </div>
        </div>
        {difficultyConfig.timePerQuestion && (
          <div className={`ml-4 px-4 py-2 rounded-lg font-bold ${timerColor} text-lg flex items-center gap-2`}>
            <Timer size={18} />
            {timeRemaining}s
          </div>
        )}
      </div>

      <div className="mb-8 p-10 bg-[#1e293b] rounded-3xl text-center border border-slate-700 shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Translate this</span>
        <h2 className="text-4xl font-bold text-white mb-4">{currentQ.target.term}</h2>
      </div>

      <div className="grid gap-3">
        {currentQ.options.map((opt, i) => {
           let btnClass = "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700";
           if (answered) {
             if (opt.isCorrect) btnClass = "bg-green-500 border-green-400 text-white shadow-lg shadow-green-900/20";
             else if (!opt.isCorrect && selectedOption === 'wrong') btnClass = "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
           }
           
           return (
             <button 
               key={i} 
               onClick={() => handleAnswer(opt)}
               disabled={answered}
               className={`p-4 rounded-xl border text-left font-bold transition-all duration-200 flex items-center justify-between group ${btnClass}`}
             >
               <span>{opt.text}</span>
               {answered && opt.isCorrect && <CheckCircle2 size={20} />}
             </button>
           );
        })}
      </div>
    </div>
  );
}

// ------------------- MATCH SESSION -------------------
function MatchSession({ words, difficulty = 'normal', addXP, onComplete, onExit }) {
  const [cards, setCards] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [mistakes, setMistakes] = useState(0);

  // Difficulty settings
  const difficultyConfig = {
    'easy': { pairCount: 4, timeLimit: null, xpMultiplier: 1 },
    'normal': { pairCount: 6, timeLimit: 120, xpMultiplier: 2 },
    'hard': { pairCount: 8, timeLimit: 90, xpMultiplier: 3 },
    'insane': { pairCount: 10, timeLimit: 60, xpMultiplier: 5 }
  }[difficulty] || { pairCount: 6, timeLimit: 120, xpMultiplier: 2 };

  const baseXP = 5;
  const xpPerPair = baseXP * difficultyConfig.xpMultiplier;

  // Setup Board
  useEffect(() => {
    if (!words || words.length < 2) return;
    
    const selection = shuffleArray(words).slice(0, difficultyConfig.pairCount);
    
    const pairs = selection.flatMap(w => [
      { id: `${w.id}-term`, content: w.term, type: 'term', pairId: w.id },
      { id: `${w.id}-def`, content: getWordContent(w), type: 'def', pairId: w.id }
    ]);

    setCards(shuffleArray(pairs));
    if (difficultyConfig.timeLimit) {
      setTimeRemaining(difficultyConfig.timeLimit);
    }
  }, [words]);

  // Timer effect
  useEffect(() => {
    if (!difficultyConfig.timeLimit || timeRemaining === null) return;
    
    if (timeRemaining <= 0) {
      setIsFinished(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(t => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining]);

  if (!words || words.length < 2) return <div className="text-center text-slate-500 mt-20">Need at least 2 words.</div>;

  const handleCardClick = (card) => {
    if (matchedIds.includes(card.id)) return;
    if (selectedIds.length === 2) return;
    if (selectedIds.includes(card.id)) return;

    const newSelected = [...selectedIds, card.id];
    setSelectedIds(newSelected);

    if (newSelected.length === 2) {
      const card1 = cards.find(c => c.id === newSelected[0]);
      const card2 = cards.find(c => c.id === newSelected[1]);

      if (card1.pairId === card2.pairId) {
        setMatchedIds(prev => [...prev, card1.id, card2.id]);
        setSelectedIds([]);
        addXP(xpPerPair);
        
        if (matchedIds.length + 2 === cards.length) {
          setTimeout(() => {
            setIsFinished(true);
            addXP(Math.max(0, 50 * difficultyConfig.xpMultiplier - mistakes * 5));
            onComplete();
          }, 600);
        }
      } else {
        setMistakes(m => m + 1);
        setTimeout(() => {
          setSelectedIds([]);
        }, 800);
      }
    }
  };

  if (isFinished) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-in zoom-in duration-300">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-slate-900 mb-6 shadow-xl animate-bounce ${
        mistakes === 0 ? 'bg-green-500 shadow-green-500/20' : 'bg-yellow-500 shadow-yellow-500/20'
      }`} style={{ animationDuration: '1.5s' }}>
        <Zap size={48} />
      </div>
      <h2 className="text-4xl font-bold text-white mb-2">Match Complete!</h2>
      <p className="text-slate-400 mb-1">Pairs matched: <span className="text-white font-bold">{matchedIds.length / 2} / {cards.length / 2}</span></p>
      <p className={`text-lg font-bold mb-2 ${mistakes === 0 ? 'text-green-400' : 'text-yellow-400'}`}>+{Math.max(0, 50 * difficultyConfig.xpMultiplier - mistakes * 5)} XP</p>
      {mistakes === 0 && (
        <p className="text-emerald-300 font-bold text-sm mb-6 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/30 animate-pulse">
          🎯 Flawless! No mistakes!
        </p>
      )}
      {mistakes !== 0 && <div className="mb-6" />}
      <button onClick={onExit} className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all hover:scale-105 active:scale-95">
        Back to Menu
      </button>
    </div>
  );

  const timerColor = timeRemaining === null ? 'text-slate-400' : timeRemaining > 30 ? 'text-blue-400' : timeRemaining > 10 ? 'text-orange-400' : 'text-red-400 animate-pulse';

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="text-yellow-400"/> Match Pairs</h2>
          <p className="text-xs text-slate-500 mt-1">Matched: {matchedIds.length / 2} / {cards.length / 2} • Mistakes: {mistakes}</p>
        </div>
        <div className="flex items-center gap-4">
          {difficultyConfig.timeLimit && (
            <div className={`px-4 py-2 rounded-lg font-bold ${timerColor} text-lg flex items-center gap-2`}>
              <Timer size={18} />
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </div>
          )}
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
            difficulty === 'normal' ? 'bg-blue-500/20 text-blue-400' :
            difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {difficulty.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const isSelected = selectedIds.includes(card.id);
          const isMatched = matchedIds.includes(card.id);

          let baseClass = "h-32 rounded-2xl p-4 flex items-center justify-center text-center font-bold text-sm md:text-base transition-all duration-200 cursor-pointer shadow-lg border-2";
          
          if (isMatched) {
             baseClass += " bg-[#0f172a] border-transparent text-slate-600 opacity-50 scale-95";
          } else if (isSelected) {
             baseClass += " bg-indigo-600 border-indigo-400 text-white scale-105 shadow-indigo-500/30 z-10";
          } else {
             baseClass += " bg-[#1e293b] border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-[#263345]";
          }

          return (
            <div 
              key={card.id} 
              onClick={() => handleCardClick(card)}
              className={baseClass}
            >
              {card.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}