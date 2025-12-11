// src/modules/study/Study.jsx
import React, { useState, useEffect } from 'react';
import { Brain, RotateCw, CheckCircle2, XCircle, ArrowLeft, ChevronLeft, ChevronRight, HelpCircle, Layers } from 'lucide-react';

export default function Study({ words = [] }) {
  const [mode, setMode] = useState('menu'); // 'menu', 'flashcards', 'quiz'

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        {mode !== 'menu' && (
          <button 
            onClick={() => setMode('menu')}
            className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Study Room</h1>
          <p className="text-slate-400">Master your vocabulary.</p>
        </div>
      </div>

      {/* --- VIEW ROUTER --- */}
      {mode === 'menu' && <StudyMenu setMode={setMode} wordCount={words.length} />}
      {mode === 'flashcards' && <FlashcardSession words={words} />}
      {mode === 'quiz' && <QuizSession words={words} />}

    </div>
  );
}

// --- 1. THE MENU (CHOICE SCREEN) ---
function StudyMenu({ setMode, wordCount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Flashcards Option */}
      <button 
        onClick={() => setMode('flashcards')}
        disabled={wordCount === 0}
        className="group relative bg-[#0f172a] border border-slate-800 hover:border-cyan-500/50 rounded-[32px] p-8 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
          <Layers size={32} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Flashcards</h2>
        <p className="text-slate-400">Flip cards to memorize terms and translations.</p>
        {wordCount === 0 && <p className="text-red-400 text-sm mt-4 font-bold">Add words to start!</p>}
      </button>

      {/* Quiz Option */}
      <button 
        onClick={() => setMode('quiz')}
        disabled={wordCount < 4}
        className="group relative bg-[#0f172a] border border-slate-800 hover:border-purple-500/50 rounded-[32px] p-8 text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
          <Brain size={32} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Quiz Mode</h2>
        <p className="text-slate-400">Test your knowledge with multiple choice questions.</p>
        {wordCount < 4 && <p className="text-red-400 text-sm mt-4 font-bold">Need at least 4 words!</p>}
      </button>

    </div>
  );
}

// --- 2. FLASHCARD ENGINE ---
function FlashcardSession({ words }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentWord = words[index];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setIndex((prev) => (prev + 1) % words.length), 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setIndex((prev) => (prev - 1 + words.length) % words.length), 150);
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      
      {/* Progress */}
      <div className="mb-6 text-slate-500 font-bold tracking-widest text-sm">
        CARD {index + 1} / {words.length}
      </div>

      {/* THE CARD (3D FLIP CONTAINER) */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full aspect-[3/2] cursor-pointer perspective-1000 group"
      >
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT (TERM) */}
          <div className="absolute inset-0 backface-hidden bg-[#1e293b] border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl">
            <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">Term</span>
            <h2 className="text-5xl font-bold text-white text-center">{currentWord.term}</h2>
            <p className="text-slate-500 mt-8 text-sm flex items-center gap-2">
              <RotateCw size={14} /> Click to flip
            </p>
          </div>

          {/* BACK (TRANSLATION) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl border-2 border-cyan-400/50">
            <span className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-4">Translation</span>
            <h2 className="text-5xl font-bold text-white text-center">{currentWord.translation}</h2>
            <div className="mt-6 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white">
              {currentWord.category}
            </div>
          </div>

        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-8 mt-10">
        <button onClick={handlePrev} className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all">
          <ChevronLeft size={32} />
        </button>
        <button onClick={handleNext} className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all">
          <ChevronRight size={32} />
        </button>
      </div>

    </div>
  );
}

// --- 3. QUIZ ENGINE ---
function QuizSession({ words }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null); // To show red/green feedback

  // Generate a new question when currentQ changes
  useEffect(() => {
    if (currentQ >= words.length) {
      setShowResult(true);
      return;
    }

    const correct = words[currentQ];
    // Pick 3 distinct wrong answers
    const wrong = words
      .filter(w => w.id !== correct.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    // Combine and shuffle
    const allOptions = [correct, ...wrong].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
    setSelectedOption(null);
  }, [currentQ, words]);

  const handleAnswer = (option) => {
    if (selectedOption) return; // Prevent double clicking
    setSelectedOption(option);

    const isCorrect = option.id === words[currentQ].id;
    if (isCorrect) setScore(s => s + 1);

    // Wait 1 second before next question so user sees the color
    setTimeout(() => {
      setCurrentQ(prev => prev + 1);
    }, 1200);
  };

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#0f172a] rounded-[40px] border border-slate-800">
        <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
          <Brain size={48} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-slate-400 text-lg mb-8">You scored <span className="text-purple-400 font-bold">{score} / {words.length}</span></p>
        <button 
          onClick={() => window.location.reload()} // Simple reset
          className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition"
        >
          Play Again
        </button>
      </div>
    );
  }

  const currentWord = words[currentQ];
  if (!currentWord) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-purple-500 transition-all duration-500"
          style={{ width: `${((currentQ) / words.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center mb-12">
        <span className="text-slate-500 font-bold tracking-widest text-sm uppercase mb-4 block">Translate this</span>
        <h2 className="text-5xl font-bold text-white">{currentWord.term}</h2>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => {
          // Logic to determine button color state
          let btnStyle = "bg-[#1e293b] border-slate-700 hover:border-purple-500 hover:bg-slate-800";
          
          if (selectedOption) {
            if (option.id === currentWord.id) {
              btnStyle = "bg-green-500/20 border-green-500 text-green-400"; // Correct Answer
            } else if (option.id === selectedOption.id) {
              btnStyle = "bg-red-500/20 border-red-500 text-red-400"; // Wrong Choice
            } else {
              btnStyle = "opacity-50 bg-[#1e293b] border-slate-800"; // Other irrelevent options
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleAnswer(option)}
              disabled={!!selectedOption}
              className={`p-6 rounded-2xl border-2 font-bold text-lg transition-all duration-200 ${btnStyle} text-white`}
            >
              {option.translation}
            </button>
          );
        })}
      </div>

    </div>
  );
}