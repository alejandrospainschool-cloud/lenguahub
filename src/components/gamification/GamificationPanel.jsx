import React, { useState } from 'react'
import { Flame, Trophy, Zap, Award, BookOpen } from 'lucide-react'
import AchievementBadge from './AchievementBadge'
import { ACHIEVEMENTS } from '../../lib/gamification-v2'

export default function GamificationPanel({ stats, user }) {
  const [activeTab, setActiveTab] = useState('overview');

  const earnedAchievementIds = new Set(
    stats?.achievements?.map(a => a.id) || []
  );

  return (
    <div className="w-full space-y-6">
      {/* TAB NAVIGATION */}
      <div className="flex gap-2 bg-slate-800/30 rounded-xl p-1">
        {['overview', 'achievements', 'progress'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === tab
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'achievements' && '🏆 Achievements'}
            {tab === 'progress' && '📈 Progress'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Level Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-blue-500/20 rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold mb-1">LEVEL</p>
            <p className="text-3xl font-black text-white">{stats?.level || 1}</p>
            <p className="text-xs text-blue-400 mt-1 font-semibold">{stats?.title || 'Principiante'}</p>
          </div>

          {/* XP Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-purple-500/20 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold mb-1">TOTAL XP</p>
            <p className="text-3xl font-black text-white">{(stats?.totalXP || 0).toLocaleString()}</p>
            <p className="text-xs text-purple-400 mt-1 font-semibold">+{stats?.currentLevelXP || 0}</p>
          </div>

          {/* Streak Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-orange-500/20 rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold mb-1">STREAK</p>
            <p className="text-3xl font-black text-white">{stats?.streak || 0}</p>
            <p className="text-xs text-orange-400 mt-1 font-semibold">days</p>
          </div>

          {/* Words Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-emerald-500/20 rounded-xl p-4 text-center">
            <BookOpen className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold mb-1">WORDS</p>
            <p className="text-3xl font-black text-white">{stats?.wordCount || 0}</p>
            <p className="text-xs text-emerald-400 mt-1 font-semibold">collected</p>
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS TAB */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Earned Achievements */}
          {stats?.achievements && stats.achievements.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Award size={16} className="text-yellow-400" />
                Earned Achievements ({stats.achievements.length})
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {stats.achievements.map((ach) => (
                  <AchievementBadge
                    key={ach.id}
                    achievement={ach}
                    isEarned={true}
                    size="md"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 mb-4">
              Locked Achievements ({Object.keys(ACHIEVEMENTS).length - (stats?.achievements?.length || 0)})
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {Object.values(ACHIEVEMENTS).map((ach) => (
                !earnedAchievementIds.has(ach.id) && (
                  <AchievementBadge
                    key={ach.id}
                    achievement={ach}
                    isEarned={false}
                    size="md"
                  />
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS TAB */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Level Progress */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white">Level Progress</h3>
              <p className="text-xs text-slate-400">
                {stats?.currentLevelXP || 0} / {stats?.xpForNextLevel || 0} XP
              </p>
            </div>
            <div className="h-4 bg-slate-800/50 rounded-full overflow-hidden border border-blue-500/20">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-1000 shadow-lg shadow-blue-500/40"
                style={{ width: `${stats?.progressPercent || 0}%` }}
              />
            </div>
          </div>

          {/* Streak Milestones */}
          {stats?.streakMilestones && stats.streakMilestones.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Streak Milestones</h3>
              <div className="flex flex-wrap gap-2">
                {[3, 7, 14, 30, 60, 100, 365].map((milestone) => (
                  <div
                    key={milestone}
                    className={`
                      px-4 py-2 rounded-lg font-bold text-xs transition-all
                      ${stats.streakMilestones.includes(milestone)
                        ? 'bg-orange-500/30 text-orange-300 border border-orange-400/50 shadow-lg shadow-orange-500/20'
                        : 'bg-slate-800/30 text-slate-500 border border-slate-700/30'
                      }
                    `}
                  >
                    {milestone}d <Flame size={12} className="inline ml-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
            <h3 className="text-sm font-bold text-white mb-3">Stats Summary</h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Total Achievements:</span>
                <span className="font-bold text-white">{stats?.achievements?.length || 0} / {Object.keys(ACHIEVEMENTS).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total XP Earned:</span>
                <span className="font-bold text-white">{(stats?.totalXP || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Title:</span>
                <span className="font-bold" style={{ color: stats?.tierColor || '#64748b' }}>
                  {stats?.title || 'Principiante'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
