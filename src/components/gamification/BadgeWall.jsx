import React, { useMemo } from 'react'
import { BADGE_TIERS } from '../../lib/gamification-simple'
import { ChevronRight } from 'lucide-react'

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
              className="h-full rounded-xl border p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col overflow-hidden"
              style={{
                backgroundColor: `${activity.current.color}08`,
                borderColor: activity.current.color + '50',
                boxShadow: `0 4px 20px ${activity.current.color}10`,
              }}
            >
              {/* Background Accent */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ backgroundColor: activity.current.color }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Icon & Tier Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {activity.icon}
                  </div>
                  <div
                    className="px-2 py-1 rounded-lg text-xs font-bold text-white whitespace-nowrap"
                    style={{ backgroundColor: activity.current.color }}
                  >
                    {activity.current.name}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-3">
                  {activity.name}
                </h3>

                {/* Big Number */}
                <div className="mb-auto">
                  <div className="text-5xl font-black text-white">
                    {activity.count}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">completed</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-700/30 my-4" />

                {/* Progress Section */}
                {activity.next ? (
                  <div className="space-y-3">
                    {/* Current to Next Tier */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{activity.current.name}</span>
                      <ChevronRight size={14} className="text-slate-600" />
                      <span className="text-white font-semibold">{activity.next.name}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">of {activity.nextGoal}</p>
                        <p className="text-xs font-bold text-white">{Math.round(activity.progress)}%</p>
                      </div>
                      <div className="w-full h-2 bg-slate-900/60 rounded-full overflow-hidden border border-slate-700/40">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${activity.progress}%`,
                            backgroundColor: activity.current.color,
                            boxShadow: `inset 0 0 8px ${activity.current.color}40, 0 0 8px ${activity.current.color}60`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Needed Count */}
                    {activity.needed > 0 && (
                      <p className="text-xs text-center text-slate-300 bg-slate-800/30 rounded px-2 py-1.5">
                        <span className="font-bold text-white">{activity.needed}</span> more to <span className="font-semibold" style={{ color: activity.next.color }}>{activity.next.name}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs font-bold text-emerald-400">🏆 Maximum Reached</p>
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
