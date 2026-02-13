// src/modules/dashboard/AdminDashboard.jsx

import React, { useMemo } from 'react';
import { UserPlus, Link2, Unlink, Search } from 'lucide-react';

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
    const m = new Map();
    allUsers.forEach((u) => {
      if (u?.uid) m.set(u.uid, u);
    });
    return m;
  }, [allUsers]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* User Role Management */}
      <section className="bg-slate-900/80 border border-slate-700/40 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 border-b border-slate-700/40">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus size={18} className="text-cyan-400" /> User Role Management
            </h2>
            <p className="text-sm text-slate-400 mt-1">Promote/demote users. Only admin can change roles.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-400 w-full md:w-auto">
            <Search size={16} className="mr-2" />
            <input
              placeholder="Search users..."
              className="bg-transparent outline-none placeholder-slate-500 w-full"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-6">User</th>
                <th className="p-6">Role</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.filter((u) => u?.uid && u.uid !== adminUid).length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={3}>
                    No users found. Ensure users have logged in at least once so <code>users/&#123;uid&#125;</code> exists.
                  </td>
                </tr>
              )}
              {users
                .filter((u) => u?.uid && u.uid !== adminUid)
                .map((u) => (
                  <tr key={u.uid} className="hover:bg-blue-900/10 transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-white">{u.displayName || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{u.email || u.uid}</div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 rounded-full text-xs font-bold border border-slate-700 bg-slate-800 text-slate-200">
                        {(u.role || 'student').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setUserRole(u.uid, 'student')}
                          className="px-3 py-2 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-blue-900/20 text-slate-200"
                        >
                          Set Student
                        </button>
                        <button
                          onClick={() => setUserRole(u.uid, 'tutor')}
                          className="px-3 py-2 rounded-lg text-xs font-bold border border-cyan-500/30 bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-200"
                        >
                          Set Tutor
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assignment Management */}
      <section className="bg-slate-900/80 border border-slate-700/40 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 border-b border-slate-700/40">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Link2 size={18} className="text-amber-400" /> Assign Students to Tutors
            </h2>
            <p className="text-sm text-slate-400 mt-1">Assign students to tutors. Creates docs in <code>assignments</code>.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <select
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none"
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
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none"
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
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-200"
            >
              Assign
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-6">Tutor</th>
                <th className="p-6">Student</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {assignments.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={3}>
                    No assignments yet.
                  </td>
                </tr>
              )}
              {assignments.map((a) => {
                const tutor = uidToUser.get(a.tutorUid);
                const student = uidToUser.get(a.studentUid);
                return (
                  <tr key={a.id} className="hover:bg-blue-900/10 transition-colors">
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
                        className="px-3 py-2 rounded-lg text-xs font-bold border border-red-500/30 bg-red-900/20 hover:bg-red-900/40 text-red-200 inline-flex items-center gap-2"
                      >
                        <Unlink size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-xs text-slate-500 mt-4">
        Note: If a user doesn't appear here, they likely haven't logged into the app since you added the <code>users/&#123;uid&#125;</code> sync.
      </div>
    </div>
  );
}

export default AdminPanel;
