// src/modules/dashboard/TeacherDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  query,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { fetchGoogleCalendarEvents } from '../../lib/googleCalendar'
import {
  Users,
  ShieldCheck,
  Search,
  Calendar as CalendarIcon,
  ChevronRight,
  Crown,
  Mail,
  Clock,
  LogOut,
  TrendingUp,
  UserCog,
} from 'lucide-react'
import CalendarView from '../calendar/Calendar'
import AdminPanel from './AdminDashboard'
import SharedWordBank from '../words/SharedWordBank'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const assignmentDocId = (tutorUid, studentUid) => `${tutorUid}${studentUid}`

const normalizeUser = (d) => {
  const data = d?.data ? d.data() : d
  const id = d?.id || data?.id
  return {
    id: id || data?.uid,
    ...data,
    uid: data?.uid || id,
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
// STUDENT ROW COMPONENT
// ============================================================================

function StudentRow({ student, onManage }) {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student?.uid) return
    
    const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setIsPremium(!!snap.data().isPremium)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Premium snapshot error:', err)
        setLoading(false)
      }
    )
    
    return () => unsub()
  }, [student?.uid])

  const togglePremium = async () => {
    if (!student?.uid) {
      alert('Student UID missing.')
      return
    }
    
    const studentName = student.displayName || 'student'
    const newStatus = !isPremium ? 'Premium' : 'Free'
    
    if (!window.confirm(`Change ${studentName} to ${newStatus}?`)) {
      return
    }
    
    try {
      const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
      await setDoc(ref, { isPremium: !isPremium }, { merge: true })
    } catch (err) {
      console.error(err)
      alert('Error updating status')
    }
  }

  const statusClassName = isPremium
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'

  return (
    <tr className="hover:bg-white/5 transition-colors group border-b border-white/5">
      <td className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
            {student.photoURL ? (
              <img src={student.photoURL} className="w-full h-full rounded-full" alt="" />
            ) : (
              <span className="font-bold text-slate-400">
                {student.displayName?.[0] || '?'}
              </span>
            )}
          </div>
          <div>
            <div className="font-bold text-white">{student.displayName || 'Unknown'}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Mail size={10} /> {student.email || 'No email'}
            </div>
          </div>
        </div>
      </td>

      <td className="p-6">
        <button
          onClick={togglePremium}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${statusClassName}`}
        >
          {loading ? (
            '...'
          ) : isPremium ? (
            <>
              <Crown size={12} fill="currentColor" /> Premium
            </>
          ) : (
            'Student'
          )}
        </button>
      </td>

      <td className="p-6 text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <Clock size={14} />
          {student.lastLogin?.toDate 
            ? student.lastLogin.toDate().toLocaleDateString() 
            : 'Never'}
        </div>
      </td>

      <td className="p-6 text-right">
        <button
          onClick={onManage}
          className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-bold transition-all border border-blue-500/20 hover:border-blue-500/40 flex items-center gap-2 ml-auto"
        >
          Manage Words <ChevronRight size={14} />
        </button>
      </td>
    </tr>
  )
}

// ============================================================================
// STUDENT DETAIL VIEW COMPONENT
// ============================================================================

function StudentDetailView({ student, user, onBack }) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [studentMeta, setStudentMeta] = useState(null)

  useEffect(() => {
    if (!student?.uid) return
    
    const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setNotes(snap.data().teacherNotes || '')
          setStudentMeta(snap.data())
        }
      },
      (err) => {
        setLoadError(err.message || 'Error loading student metadata')
      }
    )
    
    return () => unsub()
  }, [student?.uid])

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
      await setDoc(ref, { teacherNotes: notes }, { merge: true })
    } catch (e) {
      alert('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-900/80 border border-slate-700/40 rounded-3xl p-8 max-w-3xl mx-auto animate-in fade-in">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20 hover:border-blue-500/40 flex items-center gap-2"
      >
        <ChevronRight size={14} className="rotate-180" /> Back to Roster
      </button>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-3 min-w-[120px]">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
            {student.photoURL ? (
              <img src={student.photoURL} className="w-full h-full rounded-full" alt="" />
            ) : (
              <span className="font-bold text-slate-400 text-3xl">
                {student.displayName?.[0] || '?'}
              </span>
            )}
          </div>
          <div className="font-bold text-white text-lg">
            {student.displayName || 'Unknown'}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Mail size={12} /> {student.email || 'No email'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Last Login:{' '}
            {student.lastLogin?.toDate 
              ? student.lastLogin.toDate().toLocaleString() 
              : 'Never'}
          </div>
          <div className="text-xs text-slate-400">
            Status: {studentMeta?.isPremium ? 'Premium' : 'Student'}
          </div>
        </div>

        <div className="flex-1 w-full">
          <h2 className="text-xl font-bold text-white mb-4">Teacher Notes</h2>
          <textarea
            className="w-full min-h-[120px] bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 mb-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this student..."
            disabled={saving}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveNotes}
              className="px-4 py-2 bg-blue-600/80 hover:bg-blue-700 text-white rounded-lg text-sm font-bold disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
          {loadError && <div className="text-red-400 text-xs mt-2">{loadError}</div>}

          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-2">Word Bank</h3>
            <SharedWordBank 
              user={user} 
              studentUid={student.uid} 
              isTeacherView={true} 
              onBack={onBack} 
            />
          </div>
        </div>
      </div>
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
        setTab={() => {}} 
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
        setRole(data?.role || 'student')
      },
      (err) => {
        console.error('Role snapshot error:', err)
        setRole('student')
      }
    )
    
    return () => unsub()
  }, [user?.uid])

  // ============================================================================
  // LOAD ROSTER
  // ============================================================================
  
  useEffect(() => {
    if (!role || !user?.uid) return

    const loadRoster = async () => {
      setLoading(true)
      try {
        if (isAdmin) {
          const qStudents = query(
            collection(db, 'users'), 
            where('role', '==', 'student')
          )
          const snap = await getDocs(qStudents)

          const data = snap.docs
            .map(normalizeUser)
            .filter((s) => s.uid && s.uid !== user.uid)
            .sort((a, b) => {
              const ad = a.lastLogin?.toDate ? a.lastLogin.toDate().getTime() : 0
              const bd = b.lastLogin?.toDate ? b.lastLogin.toDate().getTime() : 0
              return bd - ad
            })

          setStudents(data)
        } else if (isTutor) {
          const qAssign = query(
            collection(db, 'assignments'), 
            where('tutorUid', '==', user.uid)
          )
          const assignSnap = await getDocs(qAssign)
          const studentUids = assignSnap.docs
            .map((d) => d.data().studentUid)
            .filter(Boolean)

          const studentDocs = await Promise.all(
            studentUids.map((studentUid) => getDoc(doc(db, 'users', studentUid)))
          )

          const data = studentDocs
            .filter((s) => s.exists())
            .map((s) => normalizeUser({ id: s.id, data: () => s.data() }))
            .filter((s) => s.uid && s.uid !== user.uid)
            .sort((a, b) => {
              const ad = a.lastLogin?.toDate ? a.lastLogin.toDate().getTime() : 0
              const bd = b.lastLogin?.toDate ? b.lastLogin.toDate().getTime() : 0
              return bd - ad
            })

          setStudents(data)
        } else {
          setStudents([])
        }
      } catch (e) {
        console.error('Roster load error:', e)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    loadRoster()
  }, [role, isAdmin, isTutor, user?.uid])

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

        setAllUsers(usersData)

        const aSnap = await getDocs(collection(db, 'assignments'))
        const aData = aSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setAssignments(aData)
      } catch (e) {
        console.error('Admin load error:', e)
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
      alert('Target UID missing (user doc likely missing uid field).')
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
    } catch (e) {
      console.error('Role update error:', e)
      alert('Failed to update role. Check Firestore rules.')
    }
  }

  const assignStudentToTutor = async () => {
    if (!assignTutorUid || !assignStudentUid) {
      alert('Pick both a tutor and a student.')
      return
    }
    
    const id = assignmentDocId(assignTutorUid, assignStudentUid)

    try {
      await setDoc(doc(db, 'assignments', id), {
        tutorUid: assignTutorUid,
        studentUid: assignStudentUid,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
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
      console.error('Assign error:', e)
      alert('Failed to assign. Check Firestore rules.')
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
    } catch (e) {
      console.error('Unassign error:', e)
      alert('Failed to unassign. Check Firestore rules.')
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

            {/* Student Roster Table */}
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-2xl border border-slate-700/40 rounded-3xl overflow-hidden shadow-lg shadow-black/30">
              <div className="p-7 border-b border-slate-700/40 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-slate-900/40 to-transparent">
                <h2 className="text-2xl font-bold text-white">Student Roster</h2>
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/30 backdrop-blur-lg border border-blue-500/20 rounded-xl flex items-center px-5 py-3 text-sm text-slate-400 w-full md:w-auto hover:border-blue-400/30 transition-all">
                  <Search size={18} className="mr-3 text-blue-400/60" />
                  <input
                    placeholder="Search students..."
                    className="bg-transparent outline-none placeholder-slate-500 w-full text-slate-100 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gradient-to-r from-slate-900/60 to-slate-800/40 text-slate-300 text-xs uppercase font-bold tracking-widest border-b border-slate-700/40">
                    <tr>
                      <th className="p-6">Student</th>
                      <th className="p-6">Status</th>
                      <th className="p-6">Last Login</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading && (
                      <tr>
                        <td className="p-6 text-slate-400" colSpan={4}>
                          Loading...
                        </td>
                      </tr>
                    )}

                    {!loading && filteredStudents.length === 0 && (
                      <tr>
                        <td className="p-6 text-slate-500" colSpan={4}>
                          {isTutor
                            ? 'No students assigned to you yet. Ask the admin to assign students.'
                            : 'No students found.'}
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      filteredStudents.map((student) => (
                        <StudentRow
                          key={student.uid}
                          student={student}
                          onManage={() => {
                            setSelectedStudent(student)
                            setCurrentView('student-detail')
                          }}
                        />
                      ))}
                  </tbody>
                </table>
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