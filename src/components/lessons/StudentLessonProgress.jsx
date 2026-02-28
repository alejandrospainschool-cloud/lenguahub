// src/components/lessons/StudentLessonProgress.jsx
import React from 'react'
import { BookOpen, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { calculateLessonStats } from '../../lib/lessonTracking'

export default function StudentLessonProgress({ studentName = '', lessons = [], onViewLessons }) {
  const stats = calculateLessonStats(lessons)
  
  const percentage = (stats.thisMonth / 8) * 100
  const isComplete = stats.isPaid

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
      <div className="grid grid-cols-[1fr,auto] gap-4 items-start mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{studentName}</h3>
          <p className="text-slate-500 text-sm">{stats.thisMonth} of 8 lessons logged</p>
        </div>
        <div className="text-right">
          {isComplete ? (
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 size={18} />
              <span className="text-xs font-bold">PAYMENT DUE</span>
            </div>
          ) : stats.remaining <= 2 ? (
            <div className="flex items-center gap-1 text-amber-400">
              <AlertCircle size={18} />
              <span className="text-xs font-bold">ALMOST THERE</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-blue-400">{stats.remaining}</div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete ? 'bg-emerald-500' : stats.thisMonth >= 6 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
          <div className="text-xs text-slate-500 mb-1">Latest Lesson</div>
          <div className="text-white font-bold">
            {stats.lastLessonDate ? (
              new Date(stats.lastLessonDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })
            ) : (
              'Never'
            )}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
          <div className="text-xs text-slate-500 mb-1">Total Lessons</div>
          <div className="text-white font-bold">{stats.total}</div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onViewLessons}
        className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg font-bold text-sm border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center justify-center gap-2"
      >
        <BookOpen size={14} />
        View Lessons
      </button>
    </div>
  )
}
