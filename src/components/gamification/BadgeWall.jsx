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
    return {
      words: {
        name: 'Words',
        icon: '📚',
        count: stats.words || 0,
        badge: getActivityBadgeTier('words', stats.words || 0),
      },
      quizzes: {
        name: 'Quizzes',
        icon: '❓',
        count: stats.quizzes || 0,
        badge: getActivityBadgeTier('quizzes', stats.quizzes || 0),
      },
      matches: {
        name: 'Matches',
        icon: '🧠',
        count: stats.matches || 0,
        badge: getActivityBadgeTier('matches', stats.matches || 0),
      },
      flashcards: {
        name: 'Flashcards',
        icon: '🗂️',
        count: stats.flashcards || 0,
        badge: getActivityBadgeTier('flashcards', stats.flashcards || 0),
      },
      sentences: {
        name: 'Sentences',
        icon: '📝',
        count: stats.sentences || 0,
        badge: getActivityBadgeTier('sentences', stats.sentences || 0),
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Object.entries(activityBadges).map(([key, activity]) => (
          <div
            key={key}
            className="group"
            title={`${activity.name}: ${activity.count} completed`}
          >
            {/* Badge Container */}
            <div
              className={`
                relative flex flex-col items-center justify-center aspect-square
                rounded-2xl border-2 transition-all duration-300 cursor-pointer
                hover:scale-105 hover:shadow-lg
              `}
              style={{
                backgroundColor: `${activity.badge.color}20`,
                borderColor: activity.badge.color,
                boxShadow: `0 0 30px ${activity.badge.color}40, inset 0 0 20px ${activity.badge.color}10`,
              }}
            >
              {/* Badge Icon */}
              <div className="text-5xl mb-2">
                {activity.icon}
              </div>

              {/* Badge Name */}
              <p className="text-center font-bold text-xs text-white mb-2">
                {activity.name}
              </p>

              {/* Tier Badge */}
              <div
                className="px-2 py-1 rounded-full text-xs font-bold text-white"
                style={{
                  backgroundColor: activity.badge.color + '40',
                }}
              >
                {activity.badge.name}
              </div>

              {/* Count */}
              <p className="text-[10px] mt-2 text-slate-300 font-semibold">
                {activity.count} {key}
              </p>
            </div>

            {/* Hover Tooltip */}
            <div className={`
              absolute left-1/2 -translate-x-1/2 bottom-full mb-3 
              bg-slate-900 border border-slate-700 rounded-lg px-3 py-2
              text-xs text-slate-200 whitespace-nowrap z-10
              opacity-0 group-hover:opacity-100 pointer-events-none
              group-hover:pointer-events-auto transition-opacity duration-200
              shadow-lg
            `}>
              Tier {activity.badge.tier}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
