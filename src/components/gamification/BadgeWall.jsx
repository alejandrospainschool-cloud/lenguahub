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
    <div className="w-full space-y-8">
      {/* Section Title */}
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white">Activity Badges</h2>
        <p className="text-slate-400 text-sm">Level up your badges with every activity</p>
      </div>

      {/* 5 Activity Badges - Premium Card Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 perspective">
        {Object.entries(activityBadges).map(([key, activity]) => (
          <div key={key} className="group h-full perspective">
            {/* Card Container with shield shape */}
            <div
              className="relative h-full transition-all duration-300 hover:scale-105 hover:-translate-y-3 cursor-pointer"
              style={{
                filter: `drop-shadow(0 20px 40px ${activity.current.color}40)`,
              }}
            >
              {/* Shield/Hexagon Shape Card */}
              <div
                className="relative w-full h-full rounded-t-3xl rounded-b-lg p-6 flex flex-col items-center overflow-hidden group"
                style={{
                  background: `linear-gradient(135deg, ${activity.current.color}20 0%, ${activity.current.color}05 100%)`,
                  border: `2px solid ${activity.current.color}`,
                  boxShadow: `
                    0 0 20px ${activity.current.color}60,
                    inset 0 1px 0 ${activity.current.color}80,
                    inset 0 -2px 10px ${activity.current.color}30
                  `,
                }}
              >
                {/* Ornate Top Border Accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${activity.current.color}, ${activity.current.color}, transparent)`,
                    boxShadow: `0 0 15px ${activity.current.color}80, inset 0 1px 3px rgba(255,255,255,0.2)`,
                  }}
                />

                {/* Decorative corner lights */}
                <div
                  className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full opacity-60"
                  style={{ backgroundColor: activity.current.color }}
                />
                <div
                  className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full opacity-60"
                  style={{ backgroundColor: activity.current.color }}
                />

                {/* Background glow effect */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${activity.current.color}, transparent)`,
                  }}
                />

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-between text-center">
                  {/* Icon Container - Hexagonal */}
                  <div className="mb-3">
                    <div
                      className="relative w-16 h-16 flex items-center justify-center text-4xl"
                      style={{
                        background: `linear-gradient(135deg, ${activity.current.color}30, ${activity.current.color}10)`,
                        border: `1.5px solid ${activity.current.color}`,
                        borderRadius: '12px',
                        boxShadow: `0 0 15px ${activity.current.color}50, inset 0 0 10px ${activity.current.color}20`,
                      }}
                    >
                      {activity.icon}
                      {/* Icon shine */}
                      <div className="absolute inset-0 rounded-lg opacity-20 bg-white group-hover:opacity-40 transition-opacity duration-300" />
                    </div>
                  </div>

                  {/* Activity Name */}
                  <h3 className="text-lg font-black text-white mb-1">
                    {activity.name}
                  </h3>

                  {/* Tier Info */}
                  <p
                    className="text-xs font-bold mb-3"
                    style={{ color: activity.current.color }}
                  >
                    {activity.current.tier} / 8
                  </p>

                  {/* Big Count */}
                  <div className="mb-2">
                    <div
                      className="text-5xl font-black drop-shadow-lg"
                      style={{
                        color: activity.current.color,
                        textShadow: `0 0 20px ${activity.current.color}80, 0 2px 4px rgba(0,0,0,0.5)`,
                      }}
                    >
                      {activity.count}
                    </div>
                  </div>

                  {/* Completed Text */}
                  <p className="text-xs text-slate-300 mb-3 font-semibold">completed</p>

                  {/* Divider */}
                  <div
                    className="w-12 h-px my-2"
                    style={{
                      background: activity.current.color,
                      boxShadow: `0 0 8px ${activity.current.color}80`,
                    }}
                  />

                  {/* Progress Info */}
                  {activity.next ? (
                    <div className="w-full space-y-2 flex-1 flex flex-col justify-end">
                      {/* Tier Progression */}
                      <div className="text-xs space-y-1">
                        <p className="text-slate-400 font-semibold">
                          {activity.current.name} → {activity.next.name}
                        </p>
                        {activity.needed > 0 && (
                          <p
                            className="font-bold"
                            style={{ color: activity.current.color }}
                          >
                            {activity.needed} more
                          </p>
                        )}
                      </div>

                      {/* Current Tier Badge at Bottom */}
                      <div
                        className="mt-2 px-3 py-1.5 rounded text-xs font-bold text-white"
                        style={{
                          backgroundColor: activity.current.color,
                          boxShadow: `0 4px 12px ${activity.current.color}60`,
                        }}
                      >
                        {activity.current.name}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex-1 flex flex-col justify-end">
                      <div
                        className="px-3 py-2 rounded text-xs font-bold text-center"
                        style={{
                          backgroundColor: '#10b98130',
                          color: '#10b981',
                          border: `1px solid #10b98160`,
                        }}
                      >
                        👑 MAX TIER
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom decoration points */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: activity.current.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
