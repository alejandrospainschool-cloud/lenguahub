// src/components/ui/Input.jsx
import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full px-4 py-2.5 rounded-xl
        bg-gradient-to-br from-slate-800/40 to-slate-900/30 backdrop-blur-lg border border-blue-500/20
        text-slate-100 placeholder-slate-500
        transition-all duration-300 ease-out
        focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-blue-400/30 focus:ring-offset-0
        focus:bg-gradient-to-br focus:from-slate-800/50 focus:to-slate-900/40 focus:backdrop-blur-xl
        focus:shadow-lg focus:shadow-blue-500/20
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/10
        ${className}
      `}
    />
  );
}