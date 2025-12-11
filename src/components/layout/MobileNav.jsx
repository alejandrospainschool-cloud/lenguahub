import React from 'react';
import { LayoutGrid, Calendar, Book, GraduationCap, Brain } from 'lucide-react';

export default function MobileNav({ activeTab, setActiveTab, onTools }) {
  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6
      bg-gradient-to-r from-white/6 to-white/3 backdrop-blur
      rounded-2xl p-3 flex justify-between items-center shadow-xl">

      <button
        onClick={() => setActiveTab('home')}
        className={activeTab === 'home' ? 'text-indigo-400' : 'text-slate-300'}
      >
        <LayoutGrid />
      </button>

      <button
        onClick={() => setActiveTab('calendar')}
        className={activeTab === 'calendar' ? 'text-indigo-400' : 'text-slate-300'}
      >
        <Calendar />
      </button>

      {/* Center AI Button */}
      <button
        onClick={onTools}
        className="-mt-6 bg-indigo-500 text-white p-3 rounded-full shadow-2xl"
      >
        <Brain size={20} />
      </button>

      <button
        onClick={() => setActiveTab('words')}
        className={activeTab === 'words' ? 'text-indigo-400' : 'text-slate-300'}
      >
        <Book />
      </button>

      <button
        onClick={() => setActiveTab('study')}
        className={activeTab === 'study' ? 'text-indigo-400' : 'text-slate-300'}
      >
        <GraduationCap />
      </button>
    </nav>
  );
}