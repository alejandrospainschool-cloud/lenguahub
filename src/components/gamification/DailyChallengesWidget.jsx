import React, { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Zap, X } from 'lucide-react'
import { getDailyChallenges } from '../../lib/gamification'

export default function DailyChallengesWidget({ userProfile, onClose }) {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    const dailyChallenges = getDailyChallenges(userProfile);
    setChallenges(dailyChallenges);
  }, [userProfile]);

  const completedCount = challenges.filter(c => c.completed).length;
  const totalXP = challenges.reduce((sum, c) => sum + (c.completed ? c.xpReward : 0), 0);

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="text-3xl">📋</div>
          <div>
            <h3 className="text-xl font-bold text-white">Daily Challenges</h3>
            <p className="text-xs text-slate-400">{completedCount} of {challenges.length} completed</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-slate-700/30 rounded-full overflow-hidden border border-amber-500/10">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 shadow-lg shadow-amber-500/30"
            style={{ width: `${(completedCount / challenges.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-amber-300 font-semibold mt-2">
          {totalXP && `+${totalXP} XP available`}
        </p>
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`
              p-4 rounded-xl border transition-all duration-300
              ${challenge.completed
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-slate-800/30 border-slate-700/30 hover:border-amber-500/30 hover:bg-slate-800/50'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {challenge.completed ? (
                  <CheckCircle2 size={20} className="text-emerald-400" />
                ) : (
                  <Clock size={20} className="text-slate-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-sm ${challenge.completed ? 'text-emerald-300' : 'text-white'}`}>
                  {challenge.name}
                </h4>
                <p className={`text-xs mt-1 ${challenge.completed ? 'text-emerald-400/70' : 'text-slate-400'}`}>
                  {challenge.description}
                </p>
                {challenge.requirement && !challenge.completed && (
                  <div className="mt-2 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{ width: `${Math.min((challenge.progress / challenge.requirement) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-right">
                <Zap size={16} className={challenge.completed ? 'text-amber-300' : 'text-slate-600'} />
                <span className={`text-sm font-bold ${challenge.completed ? 'text-amber-300' : 'text-slate-400'}`}>
                  {challenge.xpReward}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bonus Message */}
      {completedCount === challenges.length && (
        <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center">
          <p className="text-emerald-300 font-bold text-sm">
            🎉 All challenges completed! Come back tomorrow for new ones.
          </p>
        </div>
      )}
    </div>
  );
}
