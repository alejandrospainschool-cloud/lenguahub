// src/components/lessons/LessonProgressCard.jsx
import React from 'react'
import { BookOpen } from 'lucide-react'
import { calculateLessonStats } from '../../lib/lessonTracking'

export default function LessonProgressCard({ lessons = [], onClick, isPremium = false }) {
  const stats = calculateLessonStats(lessons)

  if (isPremium) {
    return null // Premium users don't have lesson limits
  }

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
              Lessons Logged
            </div>
            <div className="text-white font-bold text-2xl">
              {stats.total}
              <span className="text-slate-400 text-lg ml-1">total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Lessons List */}
      <div className="mb-4">
        {lessons.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-2">No lessons logged yet</div>
        ) : (
          <div className="space-y-1 max-h-[100px] overflow-y-auto">
            {lessons.slice(0, 3).map((lesson) => (
              <div key={lesson.id} className="text-xs text-slate-400 flex items-center gap-2">
                <span className="text-blue-400">✓</span>
                <span className="line-clamp-1">{lesson.title || lesson.topic || 'Lesson'}</span>
                <span className="text-slate-600 ml-auto flex-shrink-0">{new Date(lesson.date).toLocaleDateString()}</span>
              </div>
            ))}
            {lessons.length > 3 && (
              <div className="text-xs text-slate-500 italic">+{lessons.length - 3} more</div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <button className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold text-sm rounded-lg transition-all border border-blue-500/20 hover:border-blue-500/40">
        Log New Lesson
      </button>
    </div>
  )
}
