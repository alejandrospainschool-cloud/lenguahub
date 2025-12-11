// src/modules/ai/Tools.jsx
import React, { useState } from 'react';
import { Sparkles, Brain, FileText, ArrowRight, Check, Plus, Wand2, Copy, Loader2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Tools({ user }) {
  const [activeTab, setActiveTab] = useState('vocab'); // 'vocab' or 'summary'
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null); // Stores the AI output
  const [savedIDs, setSavedIDs] = useState([]); // Tracks which words were clicked

  // --- 1. THE "AI" LOGIC (Simulated for Demo) ---
  // In a real app, you would fetch(https://api.openai.com/...) here.
  const processAI = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setResults(null);

    // Fake delay to feel like AI is thinking
    setTimeout(() => {
      if (activeTab === 'summary') {
        // SIMULATION: Summarize by taking the first 2 sentences
        const summary = inputText.split('.').slice(0, 2).join('.') + '.';
        setResults({ type: 'summary', content: summary });
      } else {
        // SIMULATION: Extract "Complex" words (words longer than 5 letters)
        const rawWords = inputText.split(/\s+/).filter(w => w.length > 5).slice(0, 6);
        
        const vocabCards = rawWords.map((word, i) => ({
          id: i,
          term: word.replace(/[^a-zA-Z]/g, ''), // Clean punctuation
          translation: "Translated", // Placeholder translation
          category: "Extracted",
          definition: "A simulated definition for this term."
        }));
        
        setResults({ type: 'vocab', items: vocabCards });
      }
      setIsProcessing(false);
    }, 1500);
  };

  // --- 2. SAVE TO WORD BANK ---
  const handleSaveToBank = async (item) => {
    if (savedIDs.includes(item.id)) return; // Prevent double save

    try {
      await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank'), {
        term: item.term,
        translation: item.translation,
        category: 'AI Generated',
        createdAt: serverTimestamp(),
      });
      
      // Mark as saved visually
      setSavedIDs(prev => [...prev, item.id]);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Could not save word.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER */}
      <div className="pt-4 text-center md:text-left">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3 justify-center md:justify-start">
          <Sparkles className="text-purple-400 fill-purple-400/20" size={32} /> 
          AI Studio
        </h1>
        <p className="text-slate-400">Analyze text, extract vocabulary, and create study materials instantly.</p>
      </div>

      {/* --- MAIN INTERFACE GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: INPUT & CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Mode Switcher */}
          <div className="bg-[#0f172a] p-1.5 rounded-2xl border border-white/10 flex relative">
            <button 
              onClick={() => setActiveTab('vocab')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${activeTab === 'vocab' ? 'text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Brain size={16} /> Vocab Extractor
            </button>
            <button 
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all relative z-10 ${activeTab === 'summary' ? 'text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <FileText size={16} /> Summarizer
            </button>
            
            {/* Sliding Background Pill */}
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl transition-all duration-300 ${activeTab === 'summary' ? 'left-[50%]' : 'left-1.5'}`}
            />
          </div>

          {/* Input Area */}
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-5 h-[400px] flex flex-col focus-within:border-purple-500/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-50" />
            
            <textarea 
              className="w-full h-full bg-transparent resize-none focus:outline-none text-slate-300 placeholder-slate-600 leading-relaxed"
              placeholder={activeTab === 'vocab' ? "Paste a Spanish article or text here..." : "Paste a long text to summarize..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={processAI}
                disabled={isProcessing || !inputText}
                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                {isProcessing ? 'Processing...' : 'Generate'}
              </button>
            </div>
          </div>

        </div>


        {/* RIGHT COLUMN: RESULTS DISPLAY */}
        <div className="lg:col-span-2">
          
          {!results && !isProcessing && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] text-center p-8">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ready to Analyze</h3>
              <p className="text-slate-500 max-w-xs">Paste text on the left to extract useful words or get a quick summary.</p>
            </div>
          )}

          {/* LOADING STATE */}
          {isProcessing && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-[#0f172a]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain size={24} className="text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-400 mt-6 font-medium animate-pulse">AI is analyzing your text...</p>
            </div>
          )}

          {/* RESULTS: SUMMARY */}
          {results?.type === 'summary' && (
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 animate-in slide-in-from-bottom-4 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <FileText className="text-purple-400" /> Summary
              </h3>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-slate-300 leading-8 font-light">
                  {results.content}
                </p>
              </div>

              <div className="mt-8 flex gap-4 border-t border-white/5 pt-6">
                <button className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
                  <Copy size={16} /> Copy Text
                </button>
              </div>
            </div>
          )}

          {/* RESULTS: VOCAB CARDS */}
          {results?.type === 'vocab' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">Detected Vocabulary</h3>
                <span className="text-xs font-bold bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                  {results.items.length} Items
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.items.map((item) => {
                  const isSaved = savedIDs.includes(item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={`p-5 rounded-2xl border transition-all duration-300 group relative
                        ${isSaved 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-[#0f172a] border-white/10 hover:border-purple-500/40'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-bold text-white">{item.term}</div>
                          <div className="text-sm text-slate-400">{item.translation}</div>
                        </div>
                        
                        <button 
                          onClick={() => handleSaveToBank(item)}
                          disabled={isSaved}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                            ${isSaved 
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                              : 'bg-slate-800 text-slate-400 hover:bg-purple-600 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                            }
                          `}
                        >
                          {isSaved ? <Check size={20} /> : <Plus size={20} />}
                        </button>
                      </div>
                      
                      {/* Definition (Reveals on hover/saved) */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs text-slate-500 leading-relaxed">{item.definition}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}