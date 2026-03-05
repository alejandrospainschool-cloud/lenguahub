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
          progressCount: count,
          goalCount: count,
        }
      }

      const currentGoal = currentTier.goals[activityName]
      const nextGoal = nextBadgeTier.goals[activityName]
      const countSinceLastTier = count - currentGoal
      const countNeededForNextTier = nextGoal - currentGoal
      const progress = Math.min(100, Math.max(0, (countSinceLastTier / countNeededForNextTier) * 100))

      return {
        current: currentTier,
        next: nextBadgeTier,
        progress,
        progressCount: Math.min(countSinceLastTier, countNeededForNextTier),
        goalCount: countNeededForNextTier,
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
        <h2 className="text-2xl font-bold text-white">Activity Badges</h2>
        <p className="text-slate-400 text-sm">Badges level up as you progress in each activity</p>
      </div>

      {/* 5 Activity Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        {Object.entries(activityBadges).map(([key, activity]) => (
          <div
            key={key}
            className="group relative"
            title={`${activity.name}: ${activity.count} completed`}
          >
            {/* Badge Card */}
            <div
              className={`
                relative flex flex-col items-center justify-center p-6
                rounded-2xl border-2 transition-all duration-300
                hover:scale-105 hover:shadow-2xl cursor-pointer
                bg-gradient-to-br
              `}
              style={{
                backgroundColor: `${activity.current.color}15`,
                borderColor: activity.current.color,
                backgroundImage: `linear-gradient(135deg, ${activity.current.color}15, ${activity.current.color}08)`,
                boxShadow: `0 0 40px ${activity.current.color}25, inset 0 0 30px ${activity.current.color}08`,
              }}
            >
              {/* Badge Icon - Large */}
              <div className="text-6xl mb-3 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                {activity.icon}
              </div>

              {/* Activity Name */}
              <p className="text-sm font-bold text-white mb-1 text-center">
                {activity.name}
              </p>

              {/* Current Tier Badge */}
              <div
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white mb-4 shadow-lg"
                style={{
                  backgroundColor: activity.current.color,
                }}
              >
                {activity.current.name} • Tier {activity.current.tier}
              </div>

              {/* Activity Count */}
              <p className="text-2xl font-black text-white mb-4">
                {activity.count}
              </p>

              {/* Progress Bar */}
              {activity.next && (
                <div className="w-full space-y-2">
                  <div className="relative h-2 bg-slate-900/50 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-lg"
                      style={{
                        width: `${activity.progress}%`,
                        backgroundColor: activity.current.color,
                        boxShadow: `0 0 15px ${activity.current.color}60`,
                      }}
                    />
                  </div>
                  
                  {/* Progress Text */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{activity.progressCount}/{activity.goalCount} to {activity.next.name}</span>
                    <span className="font-bold">{Math.round(activity.progress)}%</span>
                  </div>
                </div>
              )}

              {/* Max Tier Badge */}
              {!activity.next && (
                <div className="text-center">
                  <p className="text-xs font-bold text-emerald-400">✨ Maximum Tier Unlocked ✨</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
