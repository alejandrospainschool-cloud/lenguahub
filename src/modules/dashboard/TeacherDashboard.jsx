// src/modules/dashboard/TeacherDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, getDoc, query, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, where, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleError } from '../../lib/errorHandler';
import { fetchGoogleCalendarEvents } from '../../lib/googleCalendar';
import { Users, ShieldCheck, Search, Calendar as CalendarIcon, ChevronRight, Crown, Mail, Clock, LogOut, TrendingUp, UserCog } from 'lucide-react';
import CalendarView from '../calendar/Calendar';
import AdminPanel from './AdminDashboard';
import WordBank from '../words/WordBank';
import TeacherLessonModal from '../../components/lessons/TeacherLessonModal';

// Utility functions
// assignmentDocId and normalizeUser are already defined below, do not redeclare here

// Main TeacherDashboard removed (duplicate definition lives later in this file)
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// MUST match AdminDashboard format exactly
const assignmentDocId = (tutorUid, studentUid) => `${tutorUid}_${studentUid}`

const normalizeUser = (docSnap) => {
  const data = typeof docSnap?.data === 'function' ? docSnap.data() : docSnap || {}
  const uid = data.uid || docSnap?.id || ''

  return {
    id: docSnap?.id || data.id || uid,
    uid,
    displayName: data.displayName || '',
    email: data.email || '',
    photoURL: data.photoURL || '',
    role: data.role || 'student',
    lastLogin: data.lastLogin || null,
    createdAt: data.createdAt || null,
    ...data,
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <div className="text-red-200 font-bold text-lg">
          {this.props.title || 'Something crashed'}
        </div>
        <div className="text-red-100/80 text-sm mt-2">
          {String(this.state.error?.message || this.state.error || 'Unknown error')}
        </div>
        <div className="text-slate-300 text-xs mt-4">
          Check the browser console for more details.
        </div>
      </div>
    )
  }
}

// ============================================================================
// STUDENT ACTIVITY CARD COMPONENT (Modern card-based view)
// ============================================================================

function StudentActivityCard({ student, onViewDetails, onManageWords }) {
  const [stats, setStats] = useState({ lessons: 0, words: 0, lastActive: null })

  useEffect(() => {
    if (!student?.uid) return

    const loadStats = async () => {
      try {
        // Load lessons
        const lessonsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'lessons')
        const lessonSnap = await getDocs(lessonsRef)
        
        // Load words
        const wordsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'wordbank')
        const wordSnap = await getDocs(wordsRef)

        setStats({
          lessons: lessonSnap.size,
          words: wordSnap.size,
          lastActive: student.lastLogin?.toDate?.() || null
        })
      } catch (err) {
        console.error('Error loading stats:', err)
      }
    }

    loadStats()
  }, [student?.uid, student?.lastLogin])

  const getLastActiveText = () => {
    if (!stats.lastActive) return 'Never'
    const now = new Date()
    const diff = Math.floor((now - stats.lastActive) / 1000)
    
    if (diff < 60) return 'Now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return stats.lastActive.toLocaleDateString()
  }

  const getActivityColor = () => {
    if (!stats.lastActive) return 'text-slate-500'
    const now = new Date()
    const diff = Math.floor((now - stats.lastActive) / 1000)
    if (diff < 86400) return 'text-green-400'
    if (diff < 604800) return 'text-yellow-400'
    return 'text-slate-400'
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/60 hover:border-slate-600/70 transition-all cursor-pointer group" onClick={onViewDetails}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600 overflow-hidden flex-shrink-0">
            {student.photoURL ? (
              <img src={student.photoURL} className="w-full h-full" alt="" />
            ) : (
              <span className="font-bold text-slate-300 text-lg">
                {student.displayName?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">
              {student.displayName || 'Unknown'}
            </h3>
            <p className="text-xs text-slate-400 truncate">{student.email || 'No email'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-bold ${getActivityColor()}`}>
            {getLastActiveText()}
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-slate-700/30">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-400">{stats.lessons}</div>
          <div className="text-xs text-slate-500">Lessons</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-400">{stats.words}</div>
          <div className="text-xs text-slate-500">Words</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-cyan-400">-</div>
          <div className="text-xs text-slate-500">Progress</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails()
          }}
          className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-bold transition-all border border-blue-500/20"
        >
          View Profile
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onManageWords()
          }}
          className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-600/50"
        >
          Words
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// STUDENT PROFILE VIEW COMPONENT (Comprehensive Activity Dashboard)
// ============================================================================

function StudentDetailView({ student, user, onBack }) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [lessons, setLessons] = useState([])
  const [words, setWords] = useState([])
  const [studentMeta, setStudentMeta] = useState(null)
  const [activeTab, setActiveTab] = useState('activity') // activity, lessons, words
  const [showTeacherLessonModal, setShowTeacherLessonModal] = useState(false)
  const [addingLesson, setAddingLesson] = useState(false)

  // Load teacher notes and student metadata
  useEffect(() => {
    if (!student?.uid) return
    const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setNotes(snap.data().teacherNotes || '')
        setStudentMeta(snap.data())
      }
    }, (err) => console.error('Error loading metadata:', err))
    return () => unsub()
  }, [student?.uid])

  // Load lessons
  useEffect(() => {
    if (!student?.uid) return
    const q = query(collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'lessons'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLessons(data.sort((a, b) => new Date(b.date) - new Date(a.date)))
    })
    return () => unsub()
  }, [student?.uid])

  // Load words
  useEffect(() => {
    if (!student?.uid) return
    const q = query(collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'wordbank'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setWords(data)
    })
    return () => unsub()
  }, [student?.uid])

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
      await setDoc(ref, { teacherNotes: notes }, { merge: true })
    } catch (err) {
      handleError(err, 'Save Teacher Notes')
    } finally {
      setSaving(false)
    }
  }

  const handleAddLesson = async (lessonData) => {
    setAddingLesson(true)
    try {
      await addDoc(
        collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'lessons'),
        {
          ...lessonData,
          createdAt: serverTimestamp(),
        }
      )
      setShowTeacherLessonModal(false)
    } catch (err) {
      handleError(err, 'Add Lesson')
    } finally {
      setAddingLesson(false)
    }
  }

  const lastActive = student.lastLogin?.toDate?.() || null
  const getLastActiveColor = () => {
    if (!lastActive) return 'text-slate-500'
    const diff = Math.floor((new Date() - lastActive) / 1000)
    if (diff < 86400) return 'text-green-400'
    if (diff < 604800) return 'text-yellow-400'
    return 'text-slate-400'
  }

  const formatLastActive = () => {
    if (!lastActive) return 'Never'
    const diff = Math.floor((new Date() - lastActive) / 1000)
    if (diff < 60) return 'Online now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return lastActive.toLocaleDateString()
  }

  return (
    <div className="w-full animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 px-1">
        <button
          onClick={onBack}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
        >
          <ChevronRight size={14} className="rotate-180" /> Back
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600 overflow-hidden flex-shrink-0">
            {student.photoURL ? (
              <img src={student.photoURL} className="w-full h-full" alt="" />
            ) : (
              <span className="font-bold text-slate-300 text-2xl">
                {student.displayName?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{student.displayName || 'Unknown'}</h1>
            <p className="text-sm text-slate-400">{student.email || 'No email'}</p>
            <p className={`text-xs font-bold mt-1 ${getLastActiveColor()}`}>
              Last active: {formatLastActive()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{lessons.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total Lessons</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{words.length}</div>
          <div className="text-xs text-slate-400 mt-1">Words Added</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">-</div>
          <div className="text-xs text-slate-400 mt-1">Quizzes</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{studentMeta?.isPremium ? 'Pro' : 'Free'}</div>
          <div className="text-xs text-slate-400 mt-1">Status</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700/50">
        {[
          { id: 'activity', label: '📊 Activity' },
          { id: 'lessons', label: '📚 Lessons' },
          { id: 'words', label: '📝 Words' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-white border-blue-500 bg-blue-500/10'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Teacher Notes */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">📝 Teacher Notes</h3>
            <textarea
              className="w-full min-h-[100px] bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-100 text-sm focus:border-blue-500 focus:outline-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this student's progress, behavior, focus areas..."
              disabled={saving}
            />
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>

          {/* Recent Activity Timeline */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3">🕐 Recent Activity</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {lessons.length === 0 && words.length === 0 ? (
                <div className="bg-slate-800/40 rounded-lg p-4 text-slate-500 text-sm text-center">
                  No activity yet
                </div>
              ) : (
                <>
                  {lessons.slice(0, 5).map(lesson => (
                    <div key={lesson.id} className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3 text-sm hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white">📚 Lesson Logged</div>
                          <div className="text-xs text-slate-400 mt-1">{lesson.title || lesson.topic || 'Lesson'}</div>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{new Date(lesson.date).toLocaleDateString()}</span>
                      </div>
                      {lesson.studentNotes && (
                        <div className="text-xs text-slate-400 bg-blue-900/20 rounded p-2 mt-2">
                          💭 "{lesson.studentNotes.substring(0, 80)}..."
                        </div>
                      )}
                    </div>
                  ))}
                  {words.slice(0, 2).map(word => (
                    <div key={word.id} className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3 text-sm hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white">📝 Word Added</div>
                          <div className="text-xs text-slate-300 mt-1 font-mono">{word.term}</div>
                        </div>
                        <span className="text-xs text-slate-500">in {word.category}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: LESSONS */}
      {activeTab === 'lessons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">📚 Lesson History ({lessons.length} total)</h3>
            <button
              onClick={() => setShowTeacherLessonModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all border border-purple-500/50"
            >
              + Add Lesson
            </button>
          </div>
          {lessons.length === 0 ? (
            <div className="bg-slate-800/40 rounded-lg p-6 text-slate-500 text-sm text-center">
              No lessons logged yet. You'll see a full history here.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {lessons.map(lesson => (
                <div key={lesson.id} className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4 hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-white">{lesson.title || lesson.topic || 'Lesson'}</div>
                      <div className="text-xs text-slate-400 mt-1">Type: {lesson.lessonType || 'General'}</div>
                      {lesson.addedByTeacher && (
                        <div className="text-xs text-purple-400 mt-1">👨‍🏫 Added by teacher</div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{new Date(lesson.date).toLocaleDateString()}</span>
                  </div>
                  {lesson.studentNotes && (
                    <div className="text-xs text-slate-300 bg-blue-900/20 rounded p-2 mt-2 border border-blue-800/30">
                      <div className="text-blue-300 font-bold mb-1">Student Notes:</div>
                      {lesson.studentNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: WORDS */}
      {activeTab === 'words' && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3">📝 Word Bank ({words.length} total)</h3>
          {words.length === 0 ? (
            <div className="bg-slate-800/40 rounded-lg p-6 text-slate-500 text-sm text-center">
              No words added yet
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <WordBank 
                user={user} 
                studentUid={student.uid} 
                isTeacherView={true} 
                onBack={onBack} 
              />
            </div>
          )}
        </div>
      )}

      {/* TEACHER LESSON MODAL */}
      <TeacherLessonModal
        isOpen={showTeacherLessonModal}
        onClose={() => setShowTeacherLessonModal(false)}
        onSubmit={handleAddLesson}
        isLoading={addingLesson}
        studentName={student.displayName}
      />
    </div>
  )
}

// ============================================================================
// TEACHER CALENDAR COMPONENT
// ============================================================================

function TeacherCalendar({ user }) {
  const [googleEvents, setGoogleEvents] = useState([])
  const [localEvents, setLocalEvents] = useState([])

  useEffect(() => {
    const loadGoogleEvents = async () => {
      if (!user?.token) return
      
      try {
        const gEvents = await fetchGoogleCalendarEvents(user.token)
        const formattedEvents = gEvents.map((e) => ({
          id: e.id,
          title: e.summary || 'Busy',
          date: e.start.dateTime?.split('T')[0] || e.start.date,
          time: e.start.dateTime?.split('T')[1]?.substring(0, 5) || 'All Day',
          type: 'Google Calendar',
        }))
        setGoogleEvents(formattedEvents)
      } catch (error) {
        console.error('Error loading Google Calendar events:', error)
      }
    }
    
    loadGoogleEvents()
  }, [user?.token])

  return (
    <div className="animate-in fade-in bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl">
      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl mb-6 flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
          <CalendarIcon size={20} />
        </div>
        <span className="text-blue-200 font-medium text-sm">
          Master View: Showing personal events + scheduled lessons.
        </span>
      </div>
      <CalendarView 
        user={user} 
        events={[...localEvents, ...googleEvents]} 
        setEvents={setLocalEvents} 
        studentUid={null}
        isTeacherView={true}
      />
    </div>
  )
}

// ============================================================================
// MAIN TEACHER DASHBOARD COMPONENT
// ============================================================================

export default function TeacherDashboard({ user, logout }) {
  const [currentView, setCurrentView] = useState('roster')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [adminSearch, setAdminSearch] = useState('')
  const [assignTutorUid, setAssignTutorUid] = useState('')
  const [assignStudentUid, setAssignStudentUid] = useState('')

  const isAdmin = role === 'admin'
  const isTutor = role === 'tutor'

  // ============================================================================
  // LOAD CURRENT USER ROLE
  // ============================================================================
  
  useEffect(() => {
    if (!user?.uid) return
    
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data()
        const userRole = data?.role || 'student'
        console.log('👤 User role loaded:', userRole)
        setRole(userRole)
      },
      (err) => {
        console.error('Role snapshot error:', err)
        setRole('student')
      }
    )
    
    return () => unsub()
  }, [user?.uid])

  // ============================================================================
  // LOAD ROSTER (IMPROVED WITH DEBUGGING)
  // ============================================================================
  
  useEffect(() => {
    if (!role || !user?.uid) return;
    let unsub = null;
    setLoading(true);
    console.log('📚 Loading roster for role:', role);
    if (isAdmin) {
      // Admin sees ALL students
      (async () => {
        try {
          const qStudents = query(
            collection(db, 'users'),
            where('role', '==', 'student')
          );
          const snap = await getDocs(qStudents);
          const data = snap.docs
            .map(normalizeUser)
            .filter((s) => s.uid && s.uid !== user.uid)
            .sort((a, b) => {
              const ad = a.lastLogin?.toDate ? a.lastLogin.toDate().getTime() : 0;
              const bd = b.lastLogin?.toDate ? b.lastLogin.toDate().getTime() : 0;
              return bd - ad;
            });
          console.log('👑 Admin loaded', data.length, 'students');
          setStudents(data);
        } catch (e) {
          console.error('❌ Roster load error:', e);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      })();
    } else if (isTutor) {
      // Tutor sees ONLY assigned students (real-time)
      const qAssign = query(
        collection(db, 'assignments'),
        where('tutorUid', '==', user.uid)
      );
      unsub = onSnapshot(qAssign, async (assignSnap) => {
        console.log('📋 Found', assignSnap.docs.length, 'assignments');
        assignSnap.docs.forEach(doc => {
          console.log('Assignment:', doc.id, doc.data());
        });
        const studentUids = assignSnap.docs
          .map((d) => d.data().studentUid)
          .filter(Boolean);
        console.log('👥 Student UIDs from assignments:', studentUids);
        if (studentUids.length === 0) {
          console.log('⚠️ No student UIDs found in assignments');
          setStudents([]);
          setLoading(false);
          return;
        }
        try {
          const studentDocs = await Promise.all(
            studentUids.map((studentUid) => getDoc(doc(db, 'users', studentUid)))
          );
          const data = studentDocs
            .filter((s) => {
              if (!s.exists()) {
                console.warn('⚠️ Student doc does not exist');
                return false;
              }
              return true;
            })
            .map((s) => normalizeUser({ id: s.id, data: () => s.data() }))
            .filter((s) => {
              if (!s.uid) {
                console.warn('⚠️ Student missing UID:', s);
                return false;
              }
              if (s.uid === user.uid) {
                console.log('⚠️ Filtering out self:', s.uid);
                return false;
              }
              return true;
            })
            .sort((a, b) => {
              const ad = a.lastLogin?.toDate ? a.lastLogin.toDate().getTime() : 0;
              const bd = b.lastLogin?.toDate ? b.lastLogin.toDate().getTime() : 0;
              return bd - ad;
            });
          console.log('✅ Tutor loaded', data.length, 'assigned students:', data);
          setStudents(data);
        } catch (e) {
          console.error('❌ Roster load error:', e);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      });
    } else {
      console.log('❌ Role is student, no roster to load');
      setStudents([]);
      setLoading(false);
    }
    return () => {
      if (unsub) unsub();
    };
  }, [role, isAdmin, isTutor, user?.uid]);

  // ============================================================================
  // FILTERED STUDENTS
  // ============================================================================
  
  const filteredStudents = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return students
    
    return students.filter((st) => {
      const name = (st.displayName || '').toLowerCase()
      const email = (st.email || '').toLowerCase()
      return name.includes(s) || email.includes(s)
    })
  }, [students, search])

  // ============================================================================
  // ADMIN PANEL LOAD
  // ============================================================================
  
  useEffect(() => {
    if (!isAdmin) return

    const loadAdminData = async () => {
      console.log('👑 Loading admin data...')
      try {
        const userSnap = await getDocs(collection(db, 'users'))
        const usersData = userSnap.docs
          .map(normalizeUser)
          .filter((u) => !!u.uid)
          .sort((a, b) => {
            const ad = a.lastLogin?.toDate ? a.lastLogin.toDate().getTime() : 0
            const bd = b.lastLogin?.toDate ? b.lastLogin.toDate().getTime() : 0
            return bd - ad
          })

        console.log('👥 Loaded', usersData.length, 'users')
        setAllUsers(usersData)

        const aSnap = await getDocs(collection(db, 'assignments'))
        const aData = aSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        
        console.log('📋 Loaded', aData.length, 'assignments:', aData)
        setAssignments(aData)
      } catch (e) {
        console.error('❌ Admin load error:', e)
        setAllUsers([])
        setAssignments([])
      }
    }

    loadAdminData()
  }, [isAdmin])

  // ============================================================================
  // ADMIN FILTERED USERS
  // ============================================================================
  
  const filteredAdminUsers = useMemo(() => {
    const s = adminSearch.trim().toLowerCase()
    if (!s) return allUsers
    
    return allUsers.filter((u) => {
      const name = (u.displayName || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const r = (u.role || '').toLowerCase()
      return name.includes(s) || email.includes(s) || r.includes(s)
    })
  }, [allUsers, adminSearch])

  const tutors = useMemo(
    () => allUsers.filter((u) => u.role === 'tutor' || u.role === 'admin'), 
    [allUsers]
  )
  
  const studentsForAssign = useMemo(
    () => allUsers.filter((u) => u.role === 'student'), 
    [allUsers]
  )

  // ============================================================================
  // ADMIN FUNCTIONS
  // ============================================================================
  
  const setUserRole = async (targetUid, newRole) => {
    if (!targetUid) {
      alert('Something went wrong.')
      return
    }
    
    if (!window.confirm(`Set role for ${targetUid} to "${newRole}"?`)) {
      return
    }
    
    try {
      await setDoc(doc(db, 'users', targetUid), { role: newRole }, { merge: true })
      setAllUsers((prev) => 
        prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u))
      )
      console.log('✅ Role updated:', targetUid, '→', newRole)
    } catch (e) {
      handleError(e, 'Update User Role')
      alert('Something went wrong.')
    }
  }

  const deleteUser = async (targetUid, userName) => {
    if (!targetUid) {
      alert('Something went wrong.')
      return
    }
    
    if (!window.confirm(`⚠️ PERMANENTLY DELETE "${userName || targetUid}"?\n\nThis will delete:\n• User account\n• All lessons\n• All words\n• All settings\n\nThis CANNOT be undone.`)) {
      return
    }

    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', targetUid))
      
      // Delete user's lessons
      const lessonsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'lessons')
      const lessonsSnap = await getDocs(lessonsRef)
      for (const doc of lessonsSnap.docs) {
        await deleteDoc(doc.ref)
      }
      
      // Delete user's wordbank
      const wordbankRef = collection(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'wordbank')
      const wordSnap = await getDocs(wordbankRef)
      for (const doc of wordSnap.docs) {
        await deleteDoc(doc.ref)
      }
      
      // Delete user's settings
      await deleteDoc(doc(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'settings', 'metadata'))
      
      // Remove from local state
      setAllUsers((prev) => prev.filter((u) => u.uid !== targetUid))
      
      console.log('✅ User deleted:', targetUid)
      alert(`✅ ${userName || targetUid} has been completely deleted.`)
    } catch (e) {
      handleError(e, 'Delete User')
      alert('Something went wrong while deleting the user.')
    }
  }

  const assignStudentToTutor = async () => {
    if (!assignTutorUid || !assignStudentUid) {
      alert('Pick both a tutor and a student.')
      return
    }
    
    const id = assignmentDocId(assignTutorUid, assignStudentUid)
    console.log('🔗 Creating assignment with ID:', id)

    try {
      await setDoc(doc(db, 'assignments', id), {
        tutorUid: assignTutorUid,
        studentUid: assignStudentUid,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      })

      console.log('✅ Assignment created:', {
        id,
        tutorUid: assignTutorUid,
        studentUid: assignStudentUid
      })

      setAssignments((prev) => [
        ...prev.filter((a) => a.id !== id),
        { 
          id, 
          tutorUid: assignTutorUid, 
          studentUid: assignStudentUid, 
          createdBy: user.uid 
        },
      ])

      setAssignStudentUid('')
    } catch (e) {
      handleError(e, 'Assign Student to Tutor')
      alert('Something went wrong.')
    }
  }

  const unassign = async (tutorUid, studentUid) => {
    const id = assignmentDocId(tutorUid, studentUid)
    
    if (!window.confirm('Remove this assignment?')) {
      return
    }
    
    try {
      await deleteDoc(doc(db, 'assignments', id))
      setAssignments((prev) => prev.filter((a) => a.id !== id))
      console.log('✅ Assignment removed:', id)
    } catch (e) {
      handleError(e, 'Unassign Student from Tutor')
      alert('Something went wrong.')
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const headerButtonClass = (isActive) => {
    const base = 'px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all'
    const active = 'bg-blue-500/20 text-white border border-blue-400/30'
    const inactive = 'text-slate-400 hover:text-white'
    return `${base} ${isActive ? active : inactive}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* HEADER */}
      <header className="relative backdrop-blur-md bg-slate-900/40 border-b border-white/5 px-6 md:px-10 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-400/20">
              <ShieldCheck className="text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {isAdmin ? 'Admin Control' : 'Tutor Hub'}
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {user.email} {role ? `• ${role.toUpperCase()}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 backdrop-blur-md p-1 rounded-lg border border-white/10">
              <button
                onClick={() => {
                  setCurrentView('roster')
                  setSelectedStudent(null)
                }}
                className={headerButtonClass(
                  currentView === 'roster' || currentView === 'student-detail'
                )}
              >
                <Users size={16} /> Students
              </button>

              <button
                onClick={() => setCurrentView('calendar')}
                className={headerButtonClass(currentView === 'calendar')}
              >
                <CalendarIcon size={16} /> Calendar
              </button>

              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={headerButtonClass(currentView === 'admin')}
                >
                  <UserCog size={16} /> Admin
                </button>
              )}
            </div>

            <button
              onClick={() => {
                sessionStorage.removeItem('googleaccesstoken')
                logout()
                window.location.reload()
              }}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* VIEW: ROSTER */}
        {currentView === 'roster' && (
          <div className="space-y-6 animate-slide-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Students Card */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-2xl border border-blue-400/30 p-6 rounded-2xl flex items-center gap-4 hover:from-blue-900/60 hover:to-blue-800/40 hover:border-blue-300/50 transition-all duration-300 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/30 group cursor-pointer">
                <div className="p-4 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-xl text-blue-300 group-hover:from-blue-500/50 group-hover:to-blue-600/40 transition-all duration-300 shadow-lg shadow-blue-500/20">
                  <Users size={28} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{students.length}</div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    {isAdmin ? 'Total Students' : 'Assigned Students'}
                  </div>
                </div>
              </div>

              {/* Active Card */}
              <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 backdrop-blur-2xl border border-emerald-400/30 p-6 rounded-2xl flex items-center gap-4 hover:from-emerald-900/60 hover:to-emerald-800/40 hover:border-emerald-300/50 transition-all duration-300 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/30 group cursor-pointer">
                <div className="p-4 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 rounded-xl text-emerald-300 group-hover:from-emerald-500/50 group-hover:to-emerald-600/40 transition-all duration-300 shadow-lg shadow-emerald-500/20">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">Active</div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Recent Logins
                  </div>
                </div>
              </div>

              {/* Role Card */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-2xl border border-purple-400/30 p-6 rounded-2xl flex items-center gap-4 hover:from-purple-900/60 hover:to-purple-800/40 hover:border-purple-300/50 transition-all duration-300 shadow-lg shadow-purple-500/15 hover:shadow-purple-500/30 group cursor-pointer">
                <div className="p-4 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-xl text-purple-300 group-hover:from-purple-500/50 group-hover:to-purple-600/40 transition-all duration-300 shadow-lg shadow-purple-500/20">
                  <Crown size={28} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {isAdmin ? 'Admin' : 'Tutor'}
                  </div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Controls
                  </div>
                </div>
              </div>
            </div>

            {/* Student Roster Cards (Modern Grid) */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-2xl border border-slate-700/40 rounded-3xl shadow-lg shadow-black/30">
              <div className="p-7 border-b border-slate-700/40 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-slate-900/40 to-transparent">
                <div>
                  <h2 className="text-2xl font-bold text-white">Student Roster</h2>
                  <p className="text-xs text-slate-400 mt-1">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/30 backdrop-blur-lg border border-blue-500/20 rounded-xl flex items-center px-5 py-3 text-sm text-slate-400 w-full md:w-auto hover:border-blue-400/30 transition-all">
                  <Search size={18} className="mr-3 text-blue-400/60" />
                  <input
                    placeholder="Search by name or email..."
                    className="bg-transparent outline-none placeholder-slate-500 w-full text-slate-100 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-7">
                {loading && (
                  <div className="text-slate-400 text-center py-12">Loading students...</div>
                )}

                {!loading && filteredStudents.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-slate-500 text-sm">
                      {search ? 'No students match your search.' : isTutor
                        ? 'No students assigned to you yet. Ask the admin to assign students.'
                        : 'No students found.'}
                    </div>
                  </div>
                )}

                {!loading && filteredStudents.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
                      <StudentActivityCard
                        key={student.uid}
                        student={student}
                        onViewDetails={() => {
                          setSelectedStudent(student)
                          setCurrentView('student-detail')
                        }}
                        onManageWords={() => {
                          setSelectedStudent(student)
                          setCurrentView('word-bank')
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: STUDENT DETAIL */}
        {currentView === 'student-detail' && selectedStudent && (
          <StudentDetailView
            student={selectedStudent}
            user={user}
            onBack={() => setCurrentView('roster')}
          />
        )}

        {/* VIEW: CALENDAR */}
        {currentView === 'calendar' && <TeacherCalendar user={user} />}

        {/* VIEW: ADMIN */}
        {currentView === 'admin' && isAdmin && (
          <ErrorBoundary title="Admin page crashed">
            <AdminPanel
              adminUid={user.uid}
              users={filteredAdminUsers}
              allUsers={allUsers}
              assignments={assignments}
              tutors={tutors}
              students={studentsForAssign}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              setUserRole={setUserRole}
              deleteUser={deleteUser}
              assignTutorUid={assignTutorUid}
              setAssignTutorUid={setAssignTutorUid}
              assignStudentUid={assignStudentUid}
              setAssignStudentUid={setAssignStudentUid}
              assignStudentToTutor={assignStudentToTutor}
              unassign={unassign}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}