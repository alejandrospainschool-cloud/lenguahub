// src/components/ui/Card.jsx
import React from 'react';

export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden
        ${hover || onClick ? 'cursor-pointer hover:bg-slate-800/60 hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}