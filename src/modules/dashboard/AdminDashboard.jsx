// src/modules/dashboard/AdminDashboard.jsx
import React, { useMemo } from 'react'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  Search,
  UserPlus,
  Link2,
  Unlink,
} from 'lucide-react'

/**
 * Assignment doc id format:
 *   `${tutorUid}_${studentUid}`
 */
const assignmentDocId = (tutorUid, studentUid) => `${tutorUid}_${studentUid}`

// --- ADMIN PANEL ---
function AdminPanel({
  adminUid,
  users = [],
  allUsers = [],
  assignments = [],
  tutors = [],
  students = [],
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
      if (u?.uid) m.set(u.uid, u)
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
                .filter((u) => u?.uid && u.uid !== adminUid)
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

              {users.filter((u) => u?.uid && u.uid !== adminUid).length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={3}>
                    No users found. Ensure users have logged in at least once so `users/{"{uid}"}` exists.
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
              {tutors.filter((t) => t?.uid).map((t) => (
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
              {students.filter((s) => s?.uid).map((s) => (
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
        Note: If a user doesn't appear here, they likely haven't logged into the app since you added the 'users/{"{uid}"}' sync.
      </div>
    </div>
  )
}

export default AdminPanel
