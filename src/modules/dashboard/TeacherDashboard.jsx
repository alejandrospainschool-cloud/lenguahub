// src/modules/dashboard/TeacherDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  orderBy,
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
  ArrowLeft,
  Plus,
  Trash2,
  ChevronRight,
  Crown,
  Mail,
  Clock,
  LogOut,
  TrendingUp,
  UserPlus,
  UserCog,
  Link2,
  Unlink,
} from 'lucide-react'
import CalendarView from '../calendar/Calendar'

/**
 * Assignment doc id format used throughout:
 *   `${tutorUid}_${studentUid}`
 */
const assignmentDocId = (tutorUid, studentUid) => `${tutorUid}_${studentUid}`

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
  const [assignments, setAssignments] = useState([]) // list of {id, tutorUid, studentUid, ...}
  const [adminSearch, setAdminSearch] = useState('')
  const [assignTutorUid, setAssignTutorUid] = useState('')
  const [assignStudentUid, setAssignStudentUid] = useState('')

  // 1) LOAD CURRENT USER ROLE (real-time)
  useEffect(() => {
    if (!user?.uid) return
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data()
      setRole(data?.role || 'student')
    })
    return () => unsub()
  }, [user?.uid])

  // 2) LOAD ROSTER
  // Admin sees all students. Tutor sees assigned students only.
  useEffect(() => {
    if (!role) return

    const loadRoster = async () => {
      setLoading(true)
      try {
        if (isAdmin) {
          // Admin: all students
          const qStudents = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            orderBy('lastLogin', 'desc')
          )
          const snap = await getDocs(qStudents)
          const data = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((s) => s.uid !== user.uid)
          setStudents(data)
        } else if (isTutor) {
          // Tutor: only assigned students
          const qAssign = query(collection(db, 'assignments'), where('tutorUid', '==', user.uid))
          const assignSnap = await getDocs(qAssign)
          const studentUids = assignSnap.docs.map((d) => d.data().studentUid).filter(Boolean)

          // Fetch each student doc
          const studentDocs = await Promise.all(
            studentUids.map((uid) => getDoc(doc(db, 'users', uid)))
          )

          const data = studentDocs
            .filter((s) => s.exists())
            .map((s) => ({ id: s.id, ...s.data() }))
            .filter((s) => s.uid !== user.uid)
            // sort locally by lastLogin desc
            .sort((a, b) => {
              const ad = a.lastLogin?.toDate ? a.lastLogin.toDate().getTime() : 0
              const bd = b.lastLogin?.toDate ? b.lastLogin.toDate().getTime() : 0
              return bd - ad
            })

          setStudents(data)
        } else {
          // Not tutor/admin: shouldn’t happen due to routing, but be safe
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
  }, [role, isAdmin, isTutor, user.uid])

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
        // Load all users (students + tutors)
        const qUsers = query(collection(db, 'users'), orderBy('lastLogin', 'desc'))
        const userSnap = await getDocs(qUsers)
        const usersData = userSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setAllUsers(usersData)

        // Load all assignments
        const qA = query(collection(db, 'assignments'))
        const aSnap = await getDocs(qA)
        const aData = aSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setAssignments(aData)
      } catch (e) {
        console.error('Admin load error:', e)
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
      const role = (u.role || '').toLowerCase()
      return name.includes(s) || email.includes(s) || role.includes(s)
    })
  }, [allUsers, adminSearch])

  const tutors = useMemo(() => {
    return allUsers.filter((u) => u.role === 'tutor' || u.role === 'admin')
  }, [allUsers])

  const studentsForAssign = useMemo(() => {
    return allUsers.filter((u) => u.role === 'student')
  }, [allUsers])

  // ADMIN ACTIONS
  const setUserRole = async (targetUid, newRole) => {
    if (!window.confirm(`Set role for ${targetUid} to "${newRole}"?`)) return
    try {
      await setDoc(doc(db, 'users', targetUid), { role: newRole }, { merge: true })

      // optimistic refresh
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

      // optimistic refresh
      setAssignments((prev) => [
        ...prev.filter((a) => a.id !== id),
        { id, tutorUid: assignTutorUid, studentUid: assignStudentUid, createdBy: user.uid },
      ])

      setAssignStudentUid('')
      // keep tutor selected for speed
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
    <div className="min-h-screen bg-[#02040a] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* HEADER */}
      <header className="bg-[#0f172a] border-b border-white/5 px-6 md:px-10 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
              <ShieldCheck className="text-cyan-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {isAdmin ? 'Admin Command' : 'Tutor Command'}
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {user.email} {role ? `• ${role.toUpperCase()}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#02040a] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  setCurrentView('roster')
                  setSelectedStudent(null)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  currentView === 'roster' || currentView === 'student-detail'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={16} /> Students
              </button>

              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                  currentView === 'calendar' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon size={16} /> Calendar
              </button>

              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                    currentView === 'admin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
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
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0f172a] border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{students.length}</div>
                  <div className="text-xs text-slate-400 uppercase font-bold">
                    {isAdmin ? 'Total Students' : 'Assigned Students'}
                  </div>
                </div>
              </div>
              <div className="bg-[#0f172a] border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">Active</div>
                  <div className="text-xs text-slate-400 uppercase font-bold">Recent Logins</div>
                </div>
              </div>
              <div className="bg-[#0f172a] border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                  <Crown size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{isAdmin ? 'Admin' : 'Tutor'}</div>
                  <div className="text-xs text-slate-400 uppercase font-bold">Controls</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-white">Roster</h2>
                <div className="bg-[#02040a] border border-white/10 rounded-xl flex items-center px-4 py-2.5 text-sm text-slate-400 w-full md:w-auto">
                  <Search size={16} className="mr-2" />
                  <input
                    placeholder="Search student..."
                    className="bg-transparent outline-none placeholder-slate-600 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#02040a] text-slate-400 text-xs uppercase font-bold tracking-wider">
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
                          key={student.id}
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
          <StudentManager student={selectedStudent} onBack={() => setCurrentView('roster')} />
        )}

        {/* VIEW: CALENDAR */}
        {currentView === 'calendar' && <TeacherCalendar user={user} />}

        {/* VIEW: ADMIN */}
        {currentView === 'admin' && isAdmin && (
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
        )}
      </div>
    </div>
  )
}

// --- STUDENT ROW (Premium toggle + Manage Words) ---
function StudentRow({ student, onManage }) {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student?.uid) return
    const ref = doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'settings', 'metadata')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setIsPremium(!!snap.data().isPremium)
      setLoading(false)
    })
    return () => unsub()
  }, [student?.uid])

  const togglePremium = async () => {
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
    <tr className="hover:bg-white/[0.02] transition-colors group">
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
          className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition-all border border-blue-500/20 hover:border-blue-500 flex items-center gap-2 ml-auto"
        >
          Manage Words <ChevronRight size={14} />
        </button>
      </td>
    </tr>
  )
}

// --- STUDENT WORD MANAGER (unchanged logic; added createdBy for future audit) ---
function StudentManager({ student, onBack }) {
  const [words, setWords] = useState([])
  const [newWord, setNewWord] = useState({ term: '', translation: '', category: 'Teacher Added' })

  useEffect(() => {
    if (!student?.uid) return
    const q = query(
      collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'wordbank'),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWords(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsubscribe()
  }, [student?.uid])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newWord.term?.trim()) return

    await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'wordbank'), {
      ...newWord,
      term: newWord.term.trim(),
      translation: newWord.translation.trim(),
      createdAt: serverTimestamp(),
      mastery: 0,
      createdBy: 'tutor',
    })
    setNewWord({ term: '', translation: '', category: 'Teacher Added' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this word from student's bank?")) return
    await deleteDoc(doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'wordbank', id))
  }

  return (
    <div className="animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm bg-[#0f172a] px-4 py-2 rounded-xl border border-white/5 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Roster
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-white">{student.displayName}</h2>
          <p className="text-slate-400 text-sm">Managing Word Bank</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD FORM */}
        <div className="lg:col-span-1">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 sticky top-24">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-green-400" /> Add New Word
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Spanish Term</label>
                <input
                  className="w-full bg-[#02040a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g. Biblioteca"
                  value={newWord.term}
                  onChange={(e) => setNewWord({ ...newWord, term: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">English Translation</label>
                <input
                  className="w-full bg-[#02040a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g. Library"
                  value={newWord.translation}
                  onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-900/20"
              >
                Add to Student Bank
              </button>
            </form>
          </div>
        </div>

        {/* WORD LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-2">
            Current Collection ({words.length})
          </h3>
          {words.length === 0 && (
            <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-slate-500">
              Student has no words yet.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {words.map((w) => (
              <div
                key={w.id}
                className="bg-[#0f172a] border border-white/5 p-4 rounded-xl flex justify-between items-start group hover:border-cyan-500/30 transition-all"
              >
                <div>
                  <div className="font-bold text-white text-lg">{w.term}</div>
                  <div className="text-sm text-slate-400">{w.translation}</div>
                  <div className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                    {w.category || 'Uncategorized'}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- ADMIN PANEL ---
function AdminPanel({
  adminUid,
  users,
  allUsers,
  assignments,
  tutors,
  students,
  adminSearch,
  setAdminSearch,
  setUserRole,
  assignTutorUid,
  setAssignTutorUid,
  assignStudentUid,
  setAssignStudentUid,
  assignStudentToTutor,
  unassign,
}) {
  const uidToUser = useMemo(() => {
    const m = new Map()
    allUsers.forEach((u) => {
      if (u.uid) m.set(u.uid, u)
    })
    return m
  }, [allUsers])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Promote Tutors */}
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus size={18} className="text-cyan-400" /> Promote Tutors
            </h2>
            <p className="text-sm text-slate-400 mt-1">Only admin can change roles.</p>
          </div>

          <div className="bg-[#02040a] border border-white/10 rounded-xl flex items-center px-4 py-2.5 text-sm text-slate-400 w-full md:w-auto">
            <Search size={16} className="mr-2" />
            <input
              placeholder="Search users..."
              className="bg-transparent outline-none placeholder-slate-600 w-full"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#02040a] text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-6">User</th>
                <th className="p-6">Role</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users
                .filter((u) => u.uid !== adminUid) // don’t accidentally demote self
                .map((u) => (
                  <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-white">{u.displayName || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{u.email || u.uid}</div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-slate-200">
                        {(u.role || 'student').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setUserRole(u.uid, 'student')}
                          className="px-3 py-2 rounded-lg text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                        >
                          Set Student
                        </button>
                        <button
                          onClick={() => setUserRole(u.uid, 'tutor')}
                          className="px-3 py-2 rounded-lg text-xs font-bold border border-cyan-500/20 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-200"
                        >
                          Set Tutor
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {users.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={3}>
                    No users found. Ensure users have logged in at least once so `users/{uid}` exists.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Students to Tutors */}
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Link2 size={18} className="text-amber-400" /> Assign Students to Tutors
            </h2>
            <p className="text-sm text-slate-400 mt-1">Creates docs in `assignments`.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <select
              className="bg-[#02040a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none"
              value={assignTutorUid}
              onChange={(e) => setAssignTutorUid(e.target.value)}
            >
              <option value="">Select tutor...</option>
              {tutors.map((t) => (
                <option key={t.uid} value={t.uid}>
                  {(t.displayName || t.email || t.uid) + (t.role === 'admin' ? ' (admin)' : '')}
                </option>
              ))}
            </select>

            <select
              className="bg-[#02040a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none"
              value={assignStudentUid}
              onChange={(e) => setAssignStudentUid(e.target.value)}
            >
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.uid} value={s.uid}>
                  {s.displayName || s.email || s.uid}
                </option>
              ))}
            </select>

            <button
              onClick={assignStudentToTutor}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/20 text-amber-200"
            >
              Assign
            </button>
          </div>
        </div>

        {/* Existing assignments */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#02040a] text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-6">Tutor</th>
                <th className="p-6">Student</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assignments.map((a) => {
                const tutor = uidToUser.get(a.tutorUid)
                const student = uidToUser.get(a.studentUid)
                return (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-white">{tutor?.displayName || tutor?.email || a.tutorUid}</div>
                      <div className="text-xs text-slate-500">{a.tutorUid}</div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-white">{student?.displayName || student?.email || a.studentUid}</div>
                      <div className="text-xs text-slate-500">{a.studentUid}</div>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => unassign(a.tutorUid, a.studentUid)}
                        className="px-3 py-2 rounded-lg text-xs font-bold border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-200 inline-flex items-center gap-2"
                      >
                        <Unlink size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                )
              })}

              {assignments.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={3}>
                    No assignments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Note: If a user doesn’t appear here, they likely haven’t logged into the app since you added the `users/{uid}` sync.
      </div>
    </div>
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
