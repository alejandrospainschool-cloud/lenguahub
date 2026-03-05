import React from 'react'
import { TrendingUp } from 'lucide-react'
import { MASTERY_LEVELS } from '../../lib/gamification-v2'

export default function MasteryIndicator({ word, showLabel = true, size = 'md' }) {
  const masteryLevel = Math.min(word.mastery || 0, 5);
  const masteryData = MASTERY_LEVELS.find(m => m.level === masteryLevel) || MASTERY_LEVELS[0];

  const sizeClasses = {
    sm: 'h-2 rounded-sm',
    md: 'h-3 rounded-md',
    lg: 'h-4 rounded-lg',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400">MASTERY</span>
          <span
            className="text-xs font-bold"
            style={{ color: masteryData.color }}
          >
            {masteryData.name}
          </span>
        </div>
      )}

      <div className={`w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30 ${sizeClasses[size]}`}>
        <div
          className="h-full transition-all duration-500 shadow-lg"
          style={{
            width: `${(masteryLevel / 5) * 100}%`,
            backgroundColor: masteryData.color,
            boxShadow: `0 0 12px ${masteryData.color}40`,
          }}
        />
      </div>

      {showLabel && (
        <div className="flex gap-1 mt-2">
          {MASTERY_LEVELS.map((level) => (
            <div
              key={level.level}
              className={`
                w-3 h-3 rounded-full transition-all
                ${masteryLevel >= level.level
                  ? 'opacity-100 shadow-lg'
                  : 'opacity-25'
                }
              `}
              style={{
                backgroundColor: level.color,
                boxShadow: masteryLevel >= level.level ? `0 0 8px ${level.color}60` : 'none',
              }}
              title={level.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Mastery Levels:
 * 0 - New (Gray)
 * 1 - Learning (Blue)
 * 2 - Familiar (Purple)
 * 3 - Comfortable (Cyan)
 * 4 - Fluent (Green)
 * 5 - Mastered (Amber)
 */
