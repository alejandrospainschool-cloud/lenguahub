// src/components/ui/Card.jsx
import React from 'react';

export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        relative group overflow-hidden
        bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/40
        backdrop-blur-2xl border-1.5 border-blue-400/25
        rounded-3xl p-7
        shadow-lg shadow-blue-500/15
        ${hover || onClick ? 'cursor-pointer transition-all duration-400 ease-out' : ''}
        ${hover || onClick ? 'hover:from-slate-900/70 hover:via-slate-800/50 hover:to-slate-900/60 hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/30 hover:-translate-y-1 hover:backdrop-blur-3xl' : ''}
        ${className}
      `}
    >
      {/* Premium shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-3xl" />
      </div>
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/5 group-hover:from-blue-500/15 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none rounded-3xl" />
      
      {/* Inset light effect */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}