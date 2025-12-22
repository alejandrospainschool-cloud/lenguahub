// src/components/ui/Input.jsx
import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full p-3 rounded-xl 
        bg-slate-950/50 border border-slate-800 
        text-slate-100 placeholder-slate-500
        focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
    />
  );
}