// src/modules/dashboard/Dashboard.jsx
import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, Book, Sparkles, Brain, ArrowRight, Flame } from 'lucide-react';
// IMPORT THE NEW LOGIC
import { calculateStats } from '../../lib/gamification';

export default function Dashboard({ user, words = [], events = [], setTab }) {
  
  const upcomingCount = events.length || 0;
  
  // --- REAL-TIME GAMIFICATION STATS ---
  // We use useMemo so it recalculates only when 'words' change
  const stats = useMemo(() => calculateStats(words), [words]);

  const timelineDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-12">

      {/* 1. HEADER & LEVEL PROGRESS */}
      <header className="text-center space-y-6 pt-4">
        <div>
          <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-4">
            Hey {user?.displayName?.split(' ')[0] || 'Student'} <span className="animate-wave inline-block">👋</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium flex items-center justify-center gap-2">
            One step closer to fluency 
            {/* Show Flame if streak > 0 */}
            {stats.streak > 0 && (
              <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full text-sm font-bold border border-orange-400/20">
                <Flame size={14} fill="currentColor" /> {stats.streak} Day Streak
              </span>
            )}
          </p>
        </div>

        {/* Level / XP Bar */}
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between text-sm font-bold text-slate-400 mb-2 px-1">
            <span className="text-white">Level {stats.level}</span>
            <span>{stats.currentLevelXP} / {stats.xpForNextLevel} XP</span>
          </div>
          
          <div className="h-4 bg-slate-800/50 rounded-full border border-white/5 relative overflow-hidden">
            {/* The Glow Bar - Width is dynamic now! */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${stats.currentLevelXP}%`, // Real Percentage
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)' 
              }} 
            >
              <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 blur-[1px]" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-right">
            {10 - (stats.currentLevelXP / 10)} words to next level
          </p>
        </div>
      </header>


      {/* 2. MAIN 2x2 NAVIGATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0">
        
        <MenuCard 
          icon={<Book />} 
          title="Word Bank"
          stats={`${words.length} words collected.`} // Real Count
          desc="Grow your vocabulary."
          btnText="Open Word Bank"
          onClick={() => setTab('words')}
        />

        <MenuCard 
          icon={<CalendarIcon />} 
          title="Schedule"
          stats={`${upcomingCount} lessons planned.`}
          desc="Plan your week."
          btnText="View Schedule"
          onClick={() => setTab('calendar')}
        />

        <MenuCard 
          icon={<Brain />} 
          title="Study Mode"
          stats="Flashcards & quizzes."
          desc="Earn XP by practicing."
          btnText="Start Studying"
          onClick={() => setTab('study')}
        />

        <MenuCard 
          icon={<Sparkles />} 
          title="AI Tools"
          stats="Translate & summarize."
          desc="Get smart assistance."
          btnText="Open AI Tools"
          onClick={() => setTab('tools')}
        />

      </div>


      {/* 3. CENTERED TIMELINE */}
      <div className="pt-8 border-t border-white/5 flex flex-col items-center">
        <div className="w-full max-w-3xl flex items-center justify-between mb-6 px-4">
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm">Upcoming Schedule</h3>
          <button onClick={() => setTab('calendar')} className="text-xs text-cyan-400 font-bold hover:text-white transition">View Calendar</button>
        </div>

        <div className="w-full max-w-4xl overflow-x-auto pb-4 scrollbar-hide flex justify-center">
          <div className="flex gap-3 px-4">
            {timelineDays.map((date, index) => {
              const dayNum = date.getDate();
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const isToday = index === 0;
              
              // Check if any event matches this date
              const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
              const hasEvent = events.some(e => e.date === dateStr);

              return (
                <div 
                  key={index}
                  className={`
                    flex-shrink-0 w-14 h-18 rounded-xl flex flex-col items-center justify-center border transition-all
                    ${isToday 
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                      : 'bg-slate-800/30 border-white/5 text-slate-500 hover:bg-slate-800 hover:border-white/10'
                    }
                  `}
                >
                  <span className="text-[10px] font-bold uppercase opacity-80">{dayName}</span>
                  <span className="text-lg font-bold">{dayNum}</span>
                  {hasEvent && (
                    <div className="w-1 h-1 bg-cyan-400 rounded-full mt-1 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

// --- HELPER: Floating Glass Card ---
function MenuCard({ icon, title, stats, desc, btnText, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group relative rounded-3xl p-1 cursor-pointer transition-transform duration-300 hover:-translate-y-1"
    >
      <div 
        className="absolute inset-0 rounded-3xl bg-[#0f172a] opacity-60 backdrop-blur-xl"
        style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }} 
      />
      
      <div className="absolute inset-0 rounded-3xl border border-white/5 group-hover:border-white/10 transition-colors pointer-events-none" />

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
  );
}