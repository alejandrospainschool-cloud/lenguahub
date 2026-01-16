// src/components/ui/Card.jsx
import React from 'react';

export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        relative group overflow-hidden
        bg-gradient-to-br from-slate-900/30 to-slate-800/20
        backdrop-blur-xl border border-white/8
        rounded-3xl p-6
        shadow-glass
        ${hover || onClick ? 'cursor-pointer transition-all duration-500 ease-out' : ''}
        ${hover || onClick ? 'hover:from-slate-900/40 hover:to-slate-800/30 hover:border-white/15 hover:shadow-glass-lg hover:backdrop-blur-2xl' : ''}
        ${className}
      `}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none rounded-3xl" />
      
      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}