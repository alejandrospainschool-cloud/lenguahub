// src/components/ui/Input.jsx
import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full px-4 py-2.5 rounded-lg
        bg-slate-800/30 backdrop-blur-md border border-white/10
        text-slate-100 placeholder-slate-400
        transition-all duration-200 ease-out
        focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-blue-400/30 focus:bg-slate-800/40 focus:backdrop-blur-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:border-white/15
        ${className}
      `}
    />
  );
}