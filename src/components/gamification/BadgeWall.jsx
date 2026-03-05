import React, { useMemo } from 'react'
import { BADGE_TIERS, calculateCurrentBadge, getNextBadgeProgress } from '../../lib/gamification-simple'

export default function BadgeWall({ stats = {} }) {
  const currentBadge = useMemo(() => calculateCurrentBadge(stats), [stats])
  const nextBadgeInfo = useMemo(() => getNextBadgeProgress(stats), [stats])

  // Calculate progress for each badge towards completion
  const getBadgeProgress = (tier) => {
    const goals = tier.goals
    const current = {
      words: stats.words || 0,
      quizzes: stats.quizzes || 0,
      matches: stats.matches || 0,
      flashcards: stats.flashcards || 0,
      sentences: stats.sentences || 0,
    }

    // Calculate how many goals are met
    const goalsMet = Object.entries(goals).reduce((count, [key, goalValue]) => {
      return current[key] >= goalValue ? count + 1 : count
    }, 0)

    const totalGoals = Object.keys(goals).length
    const progressPercent = (goalsMet / totalGoals) * 100

    return {
      goalsMet,
      totalGoals,
      progressPercent,
      isUnlocked: tier.tier <= currentBadge.tier,
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Section Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Badge Wall</h2>
        <p className="text-slate-400 text-sm">Complete all requirements to unlock each badge</p>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6 bg-slate-900/20 rounded-xl border border-slate-800/30">
        {BADGE_TIERS.map((badge) => {
          const progress = getBadgeProgress(badge)
          const isUnlocked = progress.isUnlocked
          const isNext = badge.tier === currentBadge.tier + 1

          return (
            <div
              key={badge.tier}
              className="group relative h-full"
              title={`${badge.name} Badge - Tier ${badge.tier}`}
            >
              {/* Badge Container */}
              <div
                className={`
                  relative flex flex-col items-center justify-center aspect-square
                  rounded-2xl border-2 transition-all duration-300 cursor-pointer
                  hover:scale-105
                  ${isUnlocked
                    ? 'shadow-lg hover:shadow-2xl'
                    : 'hover:shadow-md'
                  }
                  ${isNext ? 'border-opacity-100 animate-pulse' : 'border-opacity-60'}
                `}
                style={{
                  backgroundColor: isUnlocked ? `${badge.color}20` : '#475569',
                  borderColor: isUnlocked ? badge.color : '#64748b',
                  boxShadow: isUnlocked
                    ? `0 0 30px ${badge.color}40, inset 0 0 20px ${badge.color}10`
                    : 'none',
                }}
              >
                {/* Badge Icon */}
                <div className={`text-4xl mb-2 transition-all duration-300 ${
                  isUnlocked ? 'scale-100 drop-shadow-lg' : 'grayscale opacity-50 scale-90'
                }`}>
                  {badge.emoji}
                </div>

                {/* Badge Name */}
                <p
                  className={`text-center font-bold text-xs transition-all duration-300 ${
                    isUnlocked ? 'text-white' : 'text-slate-500'
                  }`}
                  style={{ color: isUnlocked ? badge.color : undefined }}
                >
                  {badge.name}
                </p>

                {/* Tier Number */}
                <p className={`text-[10px] mt-1 font-semibold ${
                  isUnlocked ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Tier {badge.tier}
                </p>

                {/* Progress Ring - shows how many goals are met */}
                {!isUnlocked && (
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
                    <div
                      className="absolute inset-1 rounded-2xl border-2 transition-all duration-300"
                      style={{
                        borderColor: isNext ? badge.color : 'rgba(100, 116, 139, 0.3)',
                        opacity: isNext ? 0.8 : 0.3,
                      }}
                    />
                    <div
                      className="absolute w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300"
                      style={{
                        backgroundColor: `${badge.color}30`,
                        color: badge.color,
                      }}
                    >
                      {progress.goalsMet}/{progress.totalGoals}
                    </div>
                  </div>
                )}

                {/* Unlocked Checkmark with animation */}
                {isUnlocked && (
                  <div className="absolute top-1 right-1 bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    <span className="text-white font-bold text-xs">✓</span>
                  </div>
                )}

                {/* Next Badge Indicator - glowing effect */}
                {isNext && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-lg animate-pulse">
                    Next
                  </div>
                )}
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
                {isUnlocked ? '✓ Unlocked' : `${progress.goalsMet}/${progress.totalGoals} goals`}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-800/20 rounded-lg border border-slate-700/20">
        {[
          { key: 'words', label: 'Words', icon: '📚' },
          { key: 'quizzes', label: 'Quizzes', icon: '❓' },
          { key: 'matches', label: 'Matches', icon: '🧠' },
          { key: 'flashcards', label: 'Flashcards', icon: '🗂️' },
          { key: 'sentences', label: 'Sentences', icon: '📝' },
        ].map((item) => (
          <div key={item.key} className="text-center">
            <p className="text-2xl mb-1">{item.icon}</p>
            <p className="text-xs text-slate-400 font-medium">{item.label}</p>
            <p className="text-lg font-bold text-white">{stats[item.key] || 0}</p>
          </div>
        ))}
      </div>

      {/* Current Progress towards Next Badge (if not at Ruby) */}
      {nextBadgeInfo.nextBadge && (
        <div className="mt-6 p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-xl">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                backgroundColor: nextBadgeInfo.nextBadge.color + '20',
                borderColor: nextBadgeInfo.nextBadge.color,
                border: '2px solid',
              }}
            >
              {nextBadgeInfo.nextBadge.emoji}
            </div>
            <div>
              <h3 className="font-bold text-white">Next: {nextBadgeInfo.nextBadge.name} Badge</h3>
              <p className="text-xs text-slate-400">Complete all requirements to unlock</p>
            </div>
          </div>

          {/* Quick Progress View */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['words', 'quizzes', 'matches', 'flashcards', 'sentences'].map((key) => {
              const current = nextBadgeInfo.progress[key].current
              const goal = nextBadgeInfo.progress[key].goal
              const isComplete = current >= goal
              const iconMap = {
                words: '📚',
                quizzes: '❓',
                matches: '🧠',
                flashcards: '🗂️',
                sentences: '📝',
              }

              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border transition-all ${
                    isComplete
                      ? 'bg-emerald-500/20 border-emerald-500/40'
                      : 'bg-slate-800/30 border-slate-700/30'
                  }`}
                >
                  <p className="text-lg mb-1">{iconMap[key]}</p>
                  <p className={`text-sm font-bold ${
                    isComplete ? 'text-emerald-300' : 'text-slate-300'
                  }`}>
                    {current}/{goal}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">{key}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
