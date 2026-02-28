import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ArrowLeft, Plus, Trash2, Edit2, MessageSquare, X, Loader2, Clock, FileText } from 'lucide-react'
import { addDoc, collection, deleteDoc, doc, updateDoc, onSnapshot, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { handleError } from '../../lib/errorHandler'
import AnimatedToast from '../../components/animations/AnimatedToast'

export default function CalendarView({ user, events = [], setEvents, studentUid = null, isTeacherView = false }) {
  const [lessons, setLessons] = useState(events)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showToast, setShowToast] = useState(false)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    topic: '',
    notes: '',
    studentNotes: '',
  })

  const targetUid = studentUid || user?.uid

  // Load lessons from Firestore
  useEffect(() => {
    if (!targetUid) return
    const q = query(collection(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'lessons'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLessons(data.sort((a, b) => new Date(b.date) - new Date(a.date)))
    })
    return () => unsub()
  }, [targetUid])

  // Calculate stats
  const stats = useMemo(() => {
    const total = lessons.length
    const hours = lessons.reduce((sum, l) => sum + (l.duration || 0), 0)
    const thisMonth = lessons.filter(l => {
      const d = new Date(l.date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { total, hours, thisMonth }
  }, [lessons])

  const handleSaveLesson = useCallback(async () => {
    if (!formData.date || !formData.duration) return
    setSaving(true)
    try {
      if (editingId) {
        const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'lessons', editingId)
        await updateDoc(ref, formData)
        setToastMessage('Lesson updated')
      } else {
        await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'lessons'), formData)
        setToastMessage('Lesson logged')
      }
      setToastType('success')
      setShowToast(true)
      setShowAdd(false)
      setEditingId(null)
      setFormData({ date: new Date().toISOString().split('T')[0], duration: 60, topic: '', notes: '', studentNotes: '' })
    } catch (err) {
      handleError(err, 'Save Lesson')
      setToastMessage('Something went wrong')
      setToastType('error')
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }, [formData, targetUid, editingId])

  const handleDeleteLesson = useCallback(async (id) => {
    if (!window.confirm('Delete this lesson?')) return
    try {
      await deleteDoc(doc(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'lessons', id))
      setToastMessage('Lesson deleted')
      setToastType('info')
      setShowToast(true)
    } catch (err) {
      handleError(err, 'Delete Lesson')
    }
  }, [targetUid])

  const handleEditLesson = useCallback((lesson) => {
    setFormData({
      date: lesson.date,
      duration: lesson.duration || 60,
      topic: lesson.topic || '',
      notes: lesson.notes || '',
      studentNotes: lesson.studentNotes || '',
    })
    setEditingId(lesson.id)
    setShowAdd(true)
  }, [])

  const handleAddNote = useCallback(async (lessonId, notesType, content) => {
    try {
      const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'lessons', lessonId)
      if (notesType === 'tutor') {
        await updateDoc(ref, { notes: content })
      } else {
        await updateDoc(ref, { studentNotes: content })
      }
      setToastMessage('Notes saved')
      setToastType('success')
      setShowToast(true)
      setShowNoteModal(null)
    } catch (err) {
      handleError(err, 'Save Lesson Notes')
    }
  }, [targetUid])

  return (
    <div className="w-full mx-auto px-4 md:px-8 min-h-[60vh] flex flex-col pb-12">
      {/* Toast */}
      <AnimatedToast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Lesson Log</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track lessons and progress</p>
        </div>

        {(isTeacherView || !studentUid) && (
          <button
            onClick={() => { setEditingId(null); setFormData({ date: new Date().toISOString().split('T')[0], duration: 60, topic: '', notes: '', studentNotes: '' }); setShowAdd(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/10 active:scale-[.97] transition-all shrink-0"
          >
            <Plus size={16} /> Log Lesson
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <p className="text-slate-500 text-sm mb-1">Total Lessons</p>
          <p className="text-3xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <p className="text-slate-500 text-sm mb-1">Total Hours</p>
          <p className="text-3xl font-black text-white">{(stats.hours / 60).toFixed(1)}</p>
        </div>
        <div className="bg-slope-900/40 border border-white/5 rounded-2xl p-4">
          <p className="text-slate-500 text-sm mb-1">This Month</p>
          <p className="text-3xl font-black text-white">{stats.thisMonth}</p>
        </div>
      </div>

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-medium">No lessons logged yet</p>
          <p className="text-slate-600 text-xs mt-1">Lessons will appear here when logged</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="group bg-slate-900/30 border border-white/5 rounded-2xl p-4 hover:bg-slate-800/40 hover:border-white/10 transition-all animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-white">
                      {lesson.topic || 'Lesson Session'}
                    </h3>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30 font-bold">
                      {lesson.duration} min
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-3">
                    {new Date(lesson.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>

                  {(lesson.notes || lesson.studentNotes) && (
                    <div className="space-y-2">
                      {lesson.notes && (
                        <div className="bg-slate-800/40 rounded-lg p-3 border border-white/5">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tutor Notes</p>
                          <p className="text-slate-300 text-sm">{lesson.notes}</p>
                        </div>
                      )}
                      {lesson.studentNotes && (
                        <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Student Notes</p>
                          <p className="text-blue-100 text-sm">{lesson.studentNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {(isTeacherView || !studentUid) && (
                    <>
                      <button
                        onClick={() => setShowNoteModal({ lessonId: lesson.id, type: 'tutor', content: lesson.notes || '' })}
                        className="p-2 text-slate-600 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5 active:scale-95"
                        title="Add tutor notes"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={() => handleEditLesson(lesson)}
                        className="p-2 text-slate-600 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5 active:scale-95"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 active:scale-95"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {studentUid && (
                    <button
                      onClick={() => setShowNoteModal({ lessonId: lesson.id, type: 'student', content: lesson.studentNotes || '' })}
                      className="p-2 text-slate-600 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5 active:scale-95"
                      title="Add your notes"
                    >
                      <MessageSquare size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Lesson Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#0b1120] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-white">{editingId ? 'Edit Lesson' : 'Log Lesson'}</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Topic/Subject</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Present tense conjugation, Listening comprehension..."
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              {(isTeacherView || !studentUid) && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Tutor Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="What was covered, areas to focus on, homework, etc..."
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                    rows="4"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Student Notes</label>
                <textarea
                  value={formData.studentNotes}
                  onChange={e => setFormData({ ...formData, studentNotes: e.target.value })}
                  placeholder="Any personal notes or reflections about the lesson..."
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                  rows="4"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-white/5 shrink-0 flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNoteModal && (
        <NotesModal
          lesson={lessons.find(l => l.id === showNoteModal.lessonId)}
          noteType={showNoteModal.type}
          initialContent={showNoteModal.content}
          onSave={(content) => handleAddNote(showNoteModal.lessonId, showNoteModal.type, content)}
          onClose={() => setShowNoteModal(null)}
          isTeacher={isTeacherView || !studentUid}
        />
      )}
    </div>
  )
}

// Notes Modal Component
function NotesModal({ lesson, noteType, initialContent, onSave, onClose, isTeacher }) {
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(content)
    setSaving(false)
  }

  const title = noteType === 'tutor' ? 'Tutor Notes' : 'Student Notes'
  const description = noteType === 'tutor'
    ? 'Add notes about what was covered, homework, areas for improvement, etc.'
    : 'Add your personal notes and reflections about this lesson.'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-[#0b1120] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">{description}</p>
          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your notes here..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
            rows="6"
          />
        </div>

        <div className="p-6 pt-4 border-t border-white/5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  )
}
