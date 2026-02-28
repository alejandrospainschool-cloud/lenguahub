// src/components/lessons/LessonProgressCard.jsx
import React from 'react'
import { BookOpen, CheckCircle2, AlertCircle } from 'lucide-react'
import { calculateLessonStats, isPaymentDue } from '../../lib/lessonTracking'

export default function LessonProgressCard({ lessons = [], onClick, isPremium = false }) {
  const stats = calculateLessonStats(lessons)

  if (isPremium) {
    return null // Premium users don't have lesson limits
  }

  const percentage = (stats.thisMonth / 8) * 100
  const isComplete = stats.isPaid

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 hover:from-blue-600/15 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-600/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 rounded-xl group-hover:bg-blue-600/30 transition-colors">
            <BookOpen size={24} className="text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              This Month's Lessons
            </div>
            <div className="text-white font-bold text-2xl">
              {stats.thisMonth}
              <span className="text-slate-400 text-lg ml-1">/8</span>
            </div>
          </div>
        </div>
        <div>
          {isComplete ? (
            <CheckCircle2 size={24} className="text-emerald-400" />
          ) : stats.thisMonth >= 6 ? (
            <AlertCircle size={24} className="text-amber-400" />
          ) : (
            <div className="text-2xl">📚</div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isComplete ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-400">
          {isComplete ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              ✓ Payment due this month
            </span>
          ) : stats.remaining === 0 ? (
            <span className="text-emerald-400 font-bold">All lessons logged!</span>
          ) : stats.remaining <= 2 ? (
            <span className="text-amber-400 font-bold">
              {stats.remaining} more to reach payment
            </span>
          ) : (
            <span>{stats.remaining} more lessons</span>
          )}
        </div>
        <button className="text-blue-400 font-bold text-xs hover:text-blue-300 transition-colors">
          Log Lesson →
        </button>
      </div>
    </div>
  )
}
