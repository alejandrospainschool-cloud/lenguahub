import React, { useMemo, useState, useEffect } from 'react'
import { ArrowLeft, Trophy } from 'lucide-react'
import { calculateCurrentBadge, getNextBadgeProgress, getLevelFromXP, BADGE_TIERS } from '../../lib/gamification-simple'

export default function BadgesTab({ words, events, onBack }) {
  const [activityStats, setActivityStats] = useState({
    words: 0,
    quizzes: 0,
    matches: 0,
    flashcards: 0,
    sentences: 0,
    totalXP: 0,
  })

  // Calculate stats from words and events
  useEffect(() => {
    if (!words || !events) {
      setActivityStats({
        words: 0,
        quizzes: 0,
        matches: 0,
        flashcards: 0,
        sentences: 0,
        totalXP: 0,
      })
      return
    }

    // Count word activities
    const wordCount = words.length

    // Count quiz, match, flashcard, and sentence activities  
    let quizzes = 0;
    let matches = 0;
    let flashcards = 0;
    let sentences = 0;
    let totalXP = 0;

    // For now, we'll use activity counts if stored in events
    // If not, assume activity based on word count and calendar events
    events.forEach(event => {
      if (event?.metadata?.type === 'quiz') quizzes++;
      else if (event?.metadata?.type === 'match') matches++;
      else if (event?.metadata?.type === 'flashcard') flashcards++;
      else if (event?.metadata?.type === 'sentence') sentences++;
      
      if (event?.metadata?.xpGained) totalXP += event.metadata.xpGained;
    });

    // If we don't have explicit activity records, estimate based on words
    // This is a fallback until activity tracking is fully implemented
    if (quizzes === 0 && matches === 0 && flashcards === 0 && sentences === 0) {
      // Assume some activity based on word count for demonstration
      quizzes = Math.floor(wordCount * 0.5);
      matches = Math.floor(wordCount * 0.3);
      flashcards = Math.floor(wordCount * 0.4);
      sentences = Math.floor(wordCount * 0.2);
    }

    setActivityStats({
      words: wordCount,
      quizzes,
      matches,
      flashcards,
      sentences,
      totalXP: Math.max(totalXP, Math.floor(wordCount * 10)), // Fallback XP calculation
    })
  }, [words, events])

  const stats = useMemo(() => {
    const xp = activityStats.totalXP || 0;
    return {
      words: activityStats.words || 0,
      quizzes: activityStats.quizzes || 0,
      matches: activityStats.matches || 0,
      flashcards: activityStats.flashcards || 0,
      sentences: activityStats.sentences || 0,
      totalXP: xp,
      level: getLevelFromXP(xp).level,
    };
  }, [activityStats]);

  const currentBadge = useMemo(() => calculateCurrentBadge(stats), [stats]);
  const nextBadgeInfo = useMemo(() => getNextBadgeProgress(stats), [stats]);
  const levelInfo = useMemo(() => getLevelFromXP(stats.totalXP), [stats.totalXP]);

  const getProgressPercent = (current, goal) => {
    return Math.min(100, Math.round((current / goal) * 100));
  };

  const StatRow = ({ label, current, goal, icon }) => {
    const percent = getProgressPercent(current, goal);
    const isComplete = current >= goal;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
            {icon} {label}
          </label>
          <span className={`text-sm font-bold ${isComplete ? 'text-emerald-400' : 'text-slate-400'}`}>
            {current} / {goal}
          </span>
        </div>
        <div className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
          <div
            className={`h-full transition-all duration-500 ${
              isComplete
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                : 'bg-blue-500 shadow-lg shadow-blue-500/20'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Badges & Progress</h1>
          <p className="text-slate-400 text-sm mt-1">Track your learning milestones</p>
        </div>
      </div>

      {/* Current Badge Display */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-slate-700/30 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Badge Visual */}
          <div className="text-center flex-shrink-0">
            <div
              className="w-28 h-28 rounded-2xl flex items-center justify-center text-7xl shadow-2xl border-4 mx-auto"
              style={{
                backgroundColor: currentBadge.color + '20',
                borderColor: currentBadge.color,
                boxShadow: `0 0 40px ${currentBadge.color}40`,
              }}
            >
              {currentBadge.emoji}
            </div>
            <h2 className="text-3xl font-bold mt-4" style={{ color: currentBadge.color }}>
              {currentBadge.name} Badge
            </h2>
            <p className="text-slate-400 text-sm mt-1">Tier {currentBadge.tier} of 8</p>
          </div>

          {/* Level & XP */}
          <div className="flex-1 space-y-6">
            {/* Level */}
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="text-yellow-400" size={24} />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Level</p>
                    <p className="text-3xl font-black text-white">{stats.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">Total XP</p>
                  <p className="text-2xl font-black text-blue-400">{stats.totalXP.toLocaleString()}</p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress to Level {stats.level + 1}</span>
                  <span>{levelInfo.progressPercent}%</span>
                </div>
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-700/30">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 shadow-lg shadow-blue-500/30"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {levelInfo.currentLevelXP.toLocaleString()} / {levelInfo.xpForNextLevel.toLocaleString()} XP
                </p>
              </div>
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Words', value: stats.words, icon: '📚' },
                { label: 'Quizzes', value: stats.quizzes, icon: '❓' },
                { label: 'Matches', value: stats.matches, icon: '🧠' },
                { label: 'Flashcards', value: stats.flashcards, icon: '🗂️' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/20 text-center"
                >
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge Progression Timeline */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Badge Progression</h2>
        
        <div className="space-y-4">
          {BADGE_TIERS.map((badge) => {
            const isUnlocked = badge.tier <= currentBadge.tier;
            
            return (
              <div
                key={badge.tier}
                className={`
                  p-4 rounded-xl border transition-all
                  ${isUnlocked
                    ? 'bg-slate-800/40 border-slate-700/30 shadow-lg'
                    : 'bg-slate-900/20 border-slate-800/30 opacity-60'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Badge Icon */}
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl border-2 flex-shrink-0"
                    style={{
                      backgroundColor: badge.color + '20',
                      borderColor: badge.color,
                    }}
                  >
                    {badge.emoji}
                  </div>

                  {/* Badge Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold" style={{ color: badge.color }}>
                        {badge.name}
                      </h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        isUnlocked ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-700/30 text-slate-400'
                      }`}>
                        Tier {badge.tier}
                      </span>
                    </div>

                    {/* Mini Stats for this badge */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      {['words', 'quizzes', 'matches', 'flashcards', 'sentences'].map((stat) => {
                        const current = stats[stat];
                        const goal = badge.goals[stat];
                        const isGoalMet = current >= goal;
                        
                        return (
                          <div
                            key={stat}
                            className={`
                              p-2 rounded border
                              ${isGoalMet
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : isUnlocked
                                ? 'bg-slate-700/30 border-slate-600/30 text-slate-300'
                                : 'bg-slate-800/20 border-slate-700/20 text-slate-500'
                              }
                            `}
                          >
                            <p className="font-bold text-center">{goal}</p>
                            <p className="text-center capitalize text-[10px] opacity-75">{stat}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Unlock indicator */}
                  {isUnlocked && (
                    <div className="text-green-400 font-bold text-sm flex-shrink-0">✓</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Badge Goals (if not at Ruby) */}
      {nextBadgeInfo.nextBadge && (
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-500/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{
                backgroundColor: nextBadgeInfo.nextBadge.color + '20',
                borderColor: nextBadgeInfo.nextBadge.color,
              }}
            >
              {nextBadgeInfo.nextBadge.emoji}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Next: {nextBadgeInfo.nextBadge.name} Badge</h3>
              <p className="text-sm text-slate-400">Complete all goals to unlock</p>
            </div>
          </div>

          <div className="space-y-4">
            <StatRow
              label="Words"
              current={nextBadgeInfo.progress.words.current}
              goal={nextBadgeInfo.progress.words.goal}
              icon="📚"
            />
            <StatRow
              label="Quizzes"
              current={nextBadgeInfo.progress.quizzes.current}
              goal={nextBadgeInfo.progress.quizzes.goal}
              icon="❓"
            />
            <StatRow
              label="Matches"
              current={nextBadgeInfo.progress.matches.current}
              goal={nextBadgeInfo.progress.matches.goal}
              icon="🧠"
            />
            <StatRow
              label="Flashcards"
              current={nextBadgeInfo.progress.flashcards.current}
              goal={nextBadgeInfo.progress.flashcards.goal}
              icon="🗂️"
            />
            <StatRow
              label="Sentence Practice"
              current={nextBadgeInfo.progress.sentences.current}
              goal={nextBadgeInfo.progress.sentences.goal}
              icon="📝"
            />
          </div>
        </div>
      )}

      {/* Completed Message */}
      {!nextBadgeInfo.nextBadge && (
        <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-white mb-2">You've Reached Ruby!</h3>
          <p className="text-emerald-300 text-lg">
            Congratulations on achieving the highest badge tier! Keep learning and improving! 💎
          </p>
        </div>
      )}
    </div>
  );
}
