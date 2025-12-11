// src/modules/dashboard/TeacherDashboard.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { fetchGoogleCalendarEvents } from '../../lib/googleCalendar';
import { Users, ShieldCheck, Search, Calendar as CalendarIcon, ArrowLeft, Plus, Trash2, ChevronRight } from 'lucide-react';
import CalendarView from '../calendar/Calendar';

export default function TeacherDashboard({ user, logout }) {
  const [currentView, setCurrentView] = useState('roster'); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH STUDENT ROSTER
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'));
        const snapshot = await getDocs(q);
        const studentData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          // Hide yourself from the student list
          .filter(s => s.email.toLowerCase() !== user.email.toLowerCase());
        setStudents(studentData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [user.email]);

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 font-sans p-6 md:p-10">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" size={32} /> Teacher Hub
          </h1>
          <p className="text-slate-400 mt-2">Logged in as: <span className="text-white font-mono">{user.email}</span></p>
        </div>
        
        {/* TABS */}
        <div className="flex items-center gap-3 bg-[#0f172a] p-1.5 rounded-xl border border-white/10">
          <button 
            onClick={() => { setCurrentView('roster'); setSelectedStudent(null); }}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'roster' || currentView === 'student-detail' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={16} /> Students
          </button>
          <button 
            onClick={() => setCurrentView('calendar')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'calendar' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <CalendarIcon size={16} /> My Calendar
          </button>
        </div>

        <button 
  onClick={() => {
    sessionStorage.removeItem("google_access_token"); // Destroy Key
    logout(); // Sign out of Firebase
    window.location.reload(); // Force clean slate
  }}
  className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold text-sm transition-colors border border-red-500/20"
>
  Log Out
</button>
      </header>

      <div className="max-w-7xl mx-auto">
        
        {/* VIEW 1: STUDENT ROSTER */}
        {currentView === 'roster' && (
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Student Roster</h2>
              <div className="bg-slate-900 border border-white/10 rounded-lg flex items-center px-3 py-2 text-sm text-slate-400">
                <Search size={16} className="mr-2" />
                <input placeholder="Search..." className="bg-transparent outline-none placeholder-slate-600" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-6">Student</th>
                    <th className="p-6">Email</th>
                    <th className="p-6">Last Login</th>
                    <th className="p-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6 font-bold text-white">{student.displayName || 'Unknown'}</td>
                      <td className="p-6 text-slate-400 font-mono text-sm">{student.email}</td>
                      <td className="p-6 text-slate-400 text-sm">
                        {student.lastLogin?.toDate ? student.lastLogin.toDate().toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => { setSelectedStudent(student); setCurrentView('student-detail'); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 ml-auto">
                          Manage Words <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: STUDENT DETAIL */}
        {currentView === 'student-detail' && selectedStudent && (
          <StudentManager student={selectedStudent} onBack={() => setCurrentView('roster')} />
        )}

        {/* VIEW 3: TEACHER CALENDAR */}
        {currentView === 'calendar' && <TeacherCalendar user={user} />}
        
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: STUDENT WORD MANAGER ---
function StudentManager({ student, onBack }) {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState({ term: '', translation: '', category: 'Teacher Added' });

  useEffect(() => {
    const q = query(collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'wordbank'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [student.uid]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newWord.term) return;
    await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'wordbank'), {
      ...newWord, createdAt: serverTimestamp(),
    });
    setNewWord({ term: '', translation: '', category: 'Teacher Added' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete word?")) return;
    await deleteDoc(doc(db, 'artifacts', 'language-hub-v2', 'users', student.uid, 'wordbank', id));
  };

  return (
    <div className="animate-in slide-in-from-right-8 duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-bold text-sm">
        <ArrowLeft size={16} /> Back to Roster
      </button>
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-bold text-white">{student.displayName}'s Word Bank</h2>
          <form onSubmit={handleAdd} className="flex gap-2 bg-slate-900 p-2 rounded-xl border border-white/5">
            <input placeholder="Term" className="bg-transparent px-3 py-2 text-white outline-none w-32 border-r border-white/10" value={newWord.term} onChange={e => setNewWord({...newWord, term: e.target.value})} />
            <input placeholder="Translation" className="bg-transparent px-3 py-2 text-white outline-none w-32" value={newWord.translation} onChange={e => setNewWord({...newWord, translation: e.target.value})} />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg"><Plus size={20} /></button>
          </form>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {words.map(w => (
            <div key={w.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex justify-between items-start group hover:border-blue-500/30">
              <div>
                <div className="font-bold text-white">{w.term}</div>
                <div className="text-sm text-slate-400">{w.translation}</div>
                <div className="text-[10px] text-slate-500 mt-2 uppercase font-bold">{w.category}</div>
              </div>
              <button onClick={() => handleDelete(w.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: TEACHER CALENDAR (Shows EVERYTHING) ---
function TeacherCalendar({ user }) {
  const [googleEvents, setGoogleEvents] = useState([]);
  const [localEvents, setLocalEvents] = useState([]); 

  useEffect(() => {
    const loadGoogleEvents = async () => {
      // PRIVACY CHECK: This token belongs to the CURRENTLY logged in user.
      // If YOU are logged in, it fetches YOUR calendar. 
      // It cannot physically fetch anyone else's.
      if (user.token) {
        const gEvents = await fetchGoogleCalendarEvents(user.token);
        const formattedEvents = gEvents.map(e => ({
          id: e.id,
          title: e.summary || 'Busy',
          date: e.start.dateTime?.split('T')[0] || e.start.date,
          time: e.start.dateTime?.split('T')[1]?.substring(0, 5) || 'All Day',
          type: 'Google Calendar'
        }));
        setGoogleEvents(formattedEvents);
      }
    };
    loadGoogleEvents();
  }, [user.token]);

  return (
    <div className="animate-in fade-in">
      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-2xl mb-6 flex items-center gap-3">
        <CalendarIcon className="text-blue-400" />
        <span className="text-blue-200 font-medium text-sm">
          Showing <strong>All Events</strong> (Personal + Lessons) from your Google Calendar.
        </span>
      </div>

      <CalendarView 
        user={user} 
        events={[...localEvents, ...googleEvents]} 
        setEvents={setLocalEvents} 
        setTab={() => {}} 
      />
    </div>
  );
}