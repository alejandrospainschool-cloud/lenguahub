import React from 'react'

export default function AchievementBadge({ achievement, isEarned = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-4xl',
    lg: 'w-20 h-20 text-5xl',
  };

  return (
    <div
      className={`
        relative flex flex-col items-center gap-2
        ${!isEarned && 'opacity-50 grayscale'}
      `}
      title={achievement.description}
    >
      <div
        className={`
          flex items-center justify-center rounded-xl
          transition-all duration-300
          ${isEarned
            ? 'bg-gradient-to-br from-yellow-500/30 to-amber-500/20 shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-400/50'
            : 'bg-slate-700/30 shadow-lg shadow-slate-800/50'
          }
          ${sizeClasses[size]}
        `}
      >
        {achievement.icon}
      </div>
      <div className="text-center">
        <p className={`text-xs font-bold ${isEarned ? 'text-white' : 'text-slate-400'}`}>
          {achievement.name}
        </p>
        {isEarned && (
          <p className="text-[10px] text-yellow-400 font-semibold">+{achievement.points} pts</p>
        )}
      </div>
    </div>
  );
}
