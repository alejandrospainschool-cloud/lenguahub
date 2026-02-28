import React, { useState } from 'react'
import { X, Loader2, Calendar } from 'lucide-react'
import { LESSON_TYPES, getLessonTypeIcon } from '../../lib/lessonTracking'

export default function TeacherLessonModal({ isOpen, onClose, onSubmit, isLoading = false, studentName = '' }) {
  const [lessonType, setLessonType] = useState('mixed')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState('60')

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Please enter a lesson title')
      return
    }

    const durationNum = Math.max(15, Math.min(480, parseInt(duration) || 60))

    onSubmit({
      title: title.trim(),
      topic: title.trim(),
      lessonType,
      notes: notes.trim(),
      studentNotes: notes.trim(),
      date,
      duration: durationNum,
      status: 'logged',
      addedByTeacher: true,
    })

    // Reset form
    setTitle('')
    setNotes('')
    setLessonType('mixed')
    setDate(new Date().toISOString().split('T')[0])
    setDuration('60')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0b1120] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Add Lesson for Student</h2>
            <p className="text-sm text-slate-400 mt-1">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Lesson Type */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">
              Lesson Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LESSON_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setLessonType(type.id)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-all border ${
                    lessonType === type.id
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-lg mr-1">{getLessonTypeIcon(type.id)}</span>
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
              Lesson Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Spanish verb conjugations"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-purple-500/40 transition-all"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
              Date
            </label>
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
              <Calendar size={18} className="text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              min="15"
              max="480"
              step="15"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-purple-500/40 transition-all"
            />
            <div className="text-xs text-slate-500 mt-1">15 - 480 minutes</div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did the student work on? Any notes for them?"
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-purple-500/40 transition-all resize-none"
            />
            <div className="text-xs text-slate-500 mt-1">{notes.length}/500</div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/5 border-t border-white/5 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
            className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Adding...
              </>
            ) : (
              '✓ Add Lesson'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
