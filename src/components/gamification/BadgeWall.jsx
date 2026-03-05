import React, { useMemo } from 'react'
import { BADGE_TIERS } from '../../lib/gamification-simple'

export default function BadgeWall({ stats = {} }) {
  // Calculate badge tier for each activity type
  const getActivityBadgeTier = (activityName, count) => {
    let currentTier = 0
    for (const tier of BADGE_TIERS) {
      if (count >= tier.goals[activityName]) {
        currentTier = tier.tier
      }
    }
    return BADGE_TIERS[currentTier] || BADGE_TIERS[0]
  }

  // Get badge info for each activity
  const activityBadges = useMemo(() => {
    const getActivityProgress = (activityName, count) => {
      const currentTier = getActivityBadgeTier(activityName, count)
      
      // Find the next tier after current
      let nextBadgeTier = null
      for (const tier of BADGE_TIERS) {
        if (tier.tier > currentTier.tier) {
          nextBadgeTier = tier
          break
        }
      }

      if (!nextBadgeTier) {
        // Already at max tier
        return {
          current: currentTier,
          next: null,
          progress: 100,
          currentCount: count,
          nextGoal: count,
          needed: 0,
        }
      }

      const nextGoal = nextBadgeTier.goals[activityName]
      const needed = Math.max(0, nextGoal - count)

      return {
        current: currentTier,
        next: nextBadgeTier,
        progress: Math.min(100, Math.max(0, (count / nextGoal) * 100)),
        currentCount: count,
        nextGoal: nextGoal,
        needed: needed,
      }
    }

    return {
      words: {
        name: 'Words',
        icon: '📚',
        count: stats.words || 0,
        ...getActivityProgress('words', stats.words || 0),
      },
      quizzes: {
        name: 'Quizzes',
        icon: '❓',
        count: stats.quizzes || 0,
        ...getActivityProgress('quizzes', stats.quizzes || 0),
      },
      matches: {
        name: 'Matches',
        icon: '🧠',
        count: stats.matches || 0,
        ...getActivityProgress('matches', stats.matches || 0),
      },
      flashcards: {
        name: 'Flashcards',
        icon: '🗂️',
        count: stats.flashcards || 0,
        ...getActivityProgress('flashcards', stats.flashcards || 0),
      },
      sentences: {
        name: 'Sentences',
        icon: '📝',
        count: stats.sentences || 0,
        ...getActivityProgress('sentences', stats.sentences || 0),
      },
    }
  }, [stats.words, stats.quizzes, stats.matches, stats.flashcards, stats.sentences])

  return (
    <div className="w-full space-y-6">
      {/* Section Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white">Activity Badges</h2>
        <p className="text-slate-400 text-sm">Level up your badges with every activity</p>
      </div>

      {/* 5 Activity Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {Object.entries(activityBadges).map(([key, activity]) => (
          <div key={key} className="group h-full">
            {/* Badge Card */}
            <div
              className="h-full rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col overflow-hidden relative"
              style={{
                borderColor: activity.current.color,
                boxShadow: `0 4px 20px ${activity.current.color}20, inset 0 0 30px ${activity.current.color}08`,
              }}
            >
              {/* Animated background gradient */}
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${activity.current.color} 0%, transparent 50%)`,
                }}
              />

              {/* Decorative corners - top left */}
              <div
                className="absolute top-0 left-0 w-8 h-8 opacity-30 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${activity.current.color} 0%, transparent 70%)`,
                  clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                }}
              />

              {/* Decorative corners - bottom right */}
              <div
                className="absolute bottom-0 right-0 w-8 h-8 opacity-30 pointer-events-none"
                style={{
                  background: `linear-gradient(-45deg, ${activity.current.color} 0%, transparent 70%)`,
                  clipPath: 'polygon(100% 100%, 0 100%, 100% 0)',
                }}
              />

              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-1 opacity-60"
                style={{
                  background: `linear-gradient(90deg, transparent, ${activity.current.color}, transparent)`,
                }}
              />

              {/* Floating glow orb */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-300"
                style={{ backgroundColor: activity.current.color }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Icon & Tier Badge */}
                <div className="flex items-start justify-between mb-4">
                  {/* Icon with special background */}
                  <div
                    className="text-5xl drop-shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 p-3 rounded-xl"
                    style={{
                      backgroundColor: activity.current.color + '15',
                      border: `1.5px solid ${activity.current.color}40`,
                    }}
                  >
                    {activity.icon}
                  </div>

                  {/* Tier Badge with gradient */}
                  <div
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white whitespace-nowrap shadow-lg relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${activity.current.color} 0%, ${activity.current.color}dd 100%)`,
                      boxShadow: `0 4px 12px ${activity.current.color}50`,
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-white opacity-20 blur-sm" style={{ transform: 'skewX(-20deg)' }} />
                    <span className="relative">{activity.current.name}</span>
                  </div>
                </div>

                {/* Title with tier indicator */}
                <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
                  {activity.name}
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: activity.current.color + '20',
                      color: activity.current.color,
                    }}
                  >
                    {activity.current.tier}/8
                  </span>
                </h3>

                {/* Big Number with glow */}
                <div className="mb-auto relative">
                  <div
                    className="text-6xl font-black text-transparent bg-clip-text"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${activity.current.color}, ${activity.current.color}99)`,
                      filter: `drop-shadow(0 2px 8px ${activity.current.color}40)`,
                    }}
                  >
                    {activity.count}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">completed</p>
                </div>

                {/* Divider with glow */}
                <div
                  className="h-px my-4 opacity-40"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${activity.current.color}, transparent)`,
                    boxShadow: `0 0 10px ${activity.current.color}40`,
                  }}
                />

                {/* Progress Section */}
                {activity.next ? (
                  <div className="space-y-3">
                    {/* Current to Next Tier */}
                    <div className="flex items-center justify-between text-xs px-2.5 py-2 rounded bg-slate-800/40 border border-slate-700/50">
                      <span className="text-slate-400 font-semibold">{activity.current.name}</span>
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-white font-bold">{activity.next.name}</span>
                    </div>

                    {/* Progress Bar with glow */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">Progress</p>
                        <p className="text-xs font-bold text-white">{Math.round(activity.progress)}%</p>
                      </div>
                      <div className="w-full h-3 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/60 relative">
                        <div
                          className="h-full transition-all duration-500 rounded-full relative"
                          style={{
                            width: `${activity.progress}%`,
                            backgroundColor: activity.current.color,
                            boxShadow: `inset -2px 0 8px rgba(0,0,0,0.3), 0 0 12px ${activity.current.color}80`,
                          }}
                        >
                          {/* Animated shimmer */}
                          <div className="absolute inset-0 bg-white opacity-20 blur-sm animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Needed Count */}
                    {activity.needed > 0 && (
                      <p className="text-xs text-center font-semibold py-2 px-2.5 rounded relative overflow-hidden" 
                        style={{
                          backgroundColor: activity.current.color + '15',
                          border: `1px solid ${activity.current.color}40`,
                          color: activity.current.color,
                        }}>
                        {/* Background shine */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundColor: activity.current.color }} />
                        <span className="relative">
                          <span className="font-black">{activity.needed}</span> more to <span className="font-bold">{activity.next.name}</span>
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3 px-2 rounded relative overflow-hidden" style={{ backgroundColor: '#10b98120', border: '1px solid #10b98140' }}>
                    {/* Crown emoji for max tier */}
                    <p className="text-2xl mb-1">👑</p>
                    <p className="text-xs font-bold text-emerald-400">MAX TIER REACHED</p>
                    <p className="text-[10px] text-emerald-400/70">Ultimate Mastery Unlocked!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
