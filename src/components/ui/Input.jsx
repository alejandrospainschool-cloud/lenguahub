// src/components/ui/Input.jsx
import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full px-4 py-3 rounded-2xl
        bg-gradient-to-br from-slate-900/40 to-slate-800/30
        backdrop-blur-md border border-white/10
        text-slate-100 placeholder-slate-400
        transition-all duration-300 ease-out
        focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-blue-500/50 focus:from-slate-900/50 focus:to-slate-800/40 focus:backdrop-blur-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:border-white/15
        shadow-glass
        autofill:!bg-slate-900/40 autofill:!text-slate-100
        autofill:focus:!bg-slate-900/50
        ${className}
      `}
    />
  );
}