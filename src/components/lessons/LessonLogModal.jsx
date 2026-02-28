// src/components/lessons/LessonLogModal.jsx
import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { LESSON_TYPES, getLessonTypeIcon } from '../../lib/lessonTracking'

export default function LessonLogModal({ isOpen, onClose, onSubmit, isLoading = false }) {
  const [lessonType, setLessonType] = useState('mixed')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Please enter a lesson title')
      return
    }

    onSubmit({
      title: title.trim(),
      topic: title.trim(), // Also save as topic for Calendar compatibility
      lessonType,
      notes: notes.trim(),
      studentNotes: notes.trim(), // Also save as studentNotes for Calendar compatibility
      date: new Date().toISOString().split('T')[0],
      duration: 60, // Always 1 hour
      status: 'logged',
    })

    // Reset form
    setTitle('')
    setNotes('')
    setLessonType('mixed')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#0b1120] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Log Today's Lesson</h2>
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
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
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
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-blue-500/40 transition-all"
            />
          </div>

          {/* Duration Display */}
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600/5 border border-blue-500/20 rounded-xl">
            <span className="text-2xl">⏱️</span>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</div>
              <div className="text-white font-bold text-lg">1 Hour</div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did you work on? Any challenges or wins?"
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-blue-500/40 transition-all resize-none"
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
            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Logging...
              </>
            ) : (
              '✓ Log Lesson'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
