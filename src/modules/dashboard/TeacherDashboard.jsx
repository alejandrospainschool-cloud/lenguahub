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

/**
 * Assignment doc id format:
 *   `${tutorUid}_${studentUid}`
 */
const assignmentDocId = (tutorUid, studentUid) => `${tutorUid}_${studentUid}`

// Normalize a user doc so uid is ALWAYS present
const normalizeUser = (d) => {
  const data = d?.data ? d.data() : d
  const id = d?.id || data?.id
  return {
    id: id || data?.uid,
    ...data,
    uid: data?.uid || id, // critical
  }
}

export default function TeacherDashboard({ user, logout }) {
  const [currentView, setCurrentView] = useState('roster') // roster | student-detail | calendar | admin
  const [selectedStudent, setSelectedStudent] = useState(null)

  const [role, setRole] = useState(null) // admin | tutor | student
  const isAdmin = role === 'admin'
  const isTutor = role === 'tutor'

  const [loading, setLoading] = useState(true)

  // Roster data
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')

  // Admin panel data
  const [allUsers, setAllUsers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [adminSearch, setAdminSearch] = useState('')
  const [assignTutorUid, setAssignTutorUid] = useState('')
  const [assignStudentUid, setAssignStudentUid] = useState('')

  // 1) LOAD CURRENT USER ROLE (real-time)
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

  // 2) LOAD ROSTER
  // Admin: all students. Tutor: assigned students only.
  useEffect(() => {
    if (!role || !user?.uid) return

    const loadRoster = async () => {
      setLoading(true)
      try {
        if (isAdmin) {
          // Avoid composite index by not using orderBy here; sort locally
          const qStudents = query(collection(db, 'users'), where('role', '==', 'student'))
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
          const qAssign = query(collection(db, 'assignments'), where('tutorUid', '==', user.uid))
          const assignSnap = await getDocs(qAssign)
          const studentUids = assignSnap.docs.map((d) => d.data().studentUid).filter(Boolean)

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

  const filteredStudents = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return students
    return students.filter((st) => {
      const name = (st.displayName || '').toLowerCase()
      const email = (st.email || '').toLowerCase()
      return name.includes(s) || email.includes(s)
    })
  }, [students, search])

  // 3) ADMIN PANEL LOAD (users + assignments)
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

  const tutors = useMemo(() => allUsers.filter((u) => u.role === 'tutor' || u.role === 'admin'), [allUsers])
  const studentsForAssign = useMemo(() => allUsers.filter((u) => u.role === 'student'), [allUsers])

  const setUserRole = async (targetUid, newRole) => {
    if (!targetUid) return alert('Target UID missing (user doc likely missing uid field).')
    if (!window.confirm(`Set role for ${targetUid} to "${newRole}"?`)) return
    try {
      await setDoc(doc(db, 'users', targetUid), { role: newRole }, { merge: true })
      setAllUsers((prev) => prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u)))
    } catch (e) {
      console.error('Role update error:', e)
      alert('Failed to update role. Check Firestore rules.')
    }
  }

  const assignStudentToTutor = async () => {
    if (!assignTutorUid || !assignStudentUid) return alert('Pick both a tutor and a student.')
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
        { id, tutorUid: assignTutorUid, studentUid: assignStudentUid, createdBy: user.uid },
      ])

      setAssignStudentUid('')
    } catch (e) {
      console.error('Assign error:', e)
      alert('Failed to assign. Check Firestore rules.')
    }
  }

  const unassign = async (tutorUid, studentUid) => {
    const id = assignmentDocId(tutorUid, studentUid)
    if (!window.confirm('Remove this assignment?')) return
    try {
      await deleteDoc(doc(db, 'assignments', id))
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      console.error('Unassign error:', e)
      alert('Failed to unassign. Check Firestore rules.')
    }
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
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  currentView === 'roster' || currentView === 'student-detail'
                    ? 'bg-blue-500/20 text-white border border-blue-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={16} /> Students
              </button>

              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  currentView === 'calendar' ? 'bg-blue-500/20 text-white border border-blue-400/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon size={16} /> Calendar
              </button>

              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                    currentView === 'admin' ? 'bg-blue-500/20 text-white border border-blue-400/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCog size={16} /> Admin
                </button>
              )}
            </div>

            <button
              onClick={() => {
                sessionStorage.removeItem('google_access_token')
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800/40 transition-all">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{students.length}</div>
                  <div className="text-xs text-slate-400 uppercase font-bold">
                    {isAdmin ? 'Total Students' : 'Assigned Students'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800/40 transition-all">
                <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Active</div>
                  <div className="text-xs text-slate-400 uppercase font-bold">Recent Logins</div>
                </div>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800/40 transition-all">
                <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                  <Crown size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{isAdmin ? 'Admin' : 'Tutor'}</div>
                  <div className="text-xs text-slate-400 uppercase font-bold">Controls</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white">Student Roster</h2>
                <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-lg flex items-center px-4 py-2.5 text-sm text-slate-400 w-full md:w-auto">
                  <Search size={16} className="mr-2" />
                  <input
                    placeholder="Search students..."
                    className="bg-transparent outline-none placeholder-slate-500 w-full text-slate-100"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/40 text-slate-300 text-xs uppercase font-bold tracking-wider border-b border-white/5">
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
          <SharedWordBank
            user={user}
            studentUid={selectedStudent.uid}
            isTeacherView={true}
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

// --- STUDENT ROW ---
function StudentRow({ student, onManage }) {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student?.uid) return
    const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setIsPremium(!!snap.data().isPremium)
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
    if (!student?.uid) return alert('Student UID missing.')
    if (!window.confirm(`Change ${student.displayName || 'student'} to ${!isPremium ? 'Premium' : 'Free'}?`)) return
    try {
      const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
      await setDoc(ref, { isPremium: !isPremium }, { merge: true })
    } catch (err) {
      console.error(err)
      alert('Error updating status')
    }
  }

  return (
    <tr className="hover:bg-white/5 transition-colors group border-b border-white/5">
      <td className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
            {student.photoURL ? (
              <img src={student.photoURL} className="w-full h-full rounded-full" alt="" />
            ) : (
              <span className="font-bold text-slate-400">{student.displayName?.[0] || '?'}</span>
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            isPremium
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {loading ? '...' : isPremium ? <><Crown size={12} fill="currentColor" /> Premium</> : 'Student'}
        </button>
      </td>

      <td className="p-6 text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <Clock size={14} />
          {student.lastLogin?.toDate ? student.lastLogin.toDate().toLocaleDateString() : 'Never'}
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

// --- CALENDAR ---
function TeacherCalendar({ user }) {
  const [googleEvents, setGoogleEvents] = useState([])
  const [localEvents, setLocalEvents] = useState([])

  useEffect(() => {
    const loadGoogleEvents = async () => {
      if (!user?.token) return
      const gEvents = await fetchGoogleCalendarEvents(user.token)
      const formattedEvents = gEvents.map((e) => ({
        id: e.id,
        title: e.summary || 'Busy',
        date: e.start.dateTime?.split('T')[0] || e.start.date,
        time: e.start.dateTime?.split('T')[1]?.substring(0, 5) || 'All Day',
        type: 'Google Calendar',
      }))
      setGoogleEvents(formattedEvents)
    }
    loadGoogleEvents()
  }, [user?.token])

  return (
    <div className="animate-in fade-in bg-[#0f172a] border border-white/10 rounded-3xl p-6 shadow-2xl">
      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl mb-6 flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
          <CalendarIcon size={20} />
        </div>
        <span className="text-blue-200 font-medium text-sm">Master View: Showing personal events + scheduled lessons.</span>
      </div>
      <CalendarView user={user} events={[...localEvents, ...googleEvents]} setEvents={setLocalEvents} setTab={() => {}} />
    </div>
  )
}

// ---- ErrorBoundary (to stop grey screens and show the real error)
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
        <div className="text-red-200 font-bold text-lg">{this.props.title || 'Something crashed'}</div>
        <div className="text-red-100/80 text-sm mt-2">
          {String(this.state.error?.message || this.state.error || 'Unknown error')}
        </div>
        <div className="text-slate-300 text-xs mt-4">
          Open DevTools console to see the full stack trace.
        </div>
      </div>
    )
  }
}