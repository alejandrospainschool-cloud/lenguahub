// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './modules/dashboard/Dashboard';
import WordBank from './modules/words/WordBank';
import CalendarView from './modules/calendar/Calendar';
import Study from './modules/study/Study';
import Tools from './modules/ai/Tools';
import Login from './modules/auth/Login';
import TeacherDashboard from './modules/dashboard/TeacherDashboard';

// Firebase Logic
import { onUserStateChange, logout } from './lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';

// --- CONFIG: TEACHER EMAIL ---
// This matches the email visible in your screenshot.
const TEACHER_EMAIL = "alejandropotter16@gmail.com"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data States (For Students)
  const [words, setWords] = useState([]);
  const [events, setEvents] = useState([]);

  // 1. LOGIN LISTENER & USER SAVING
  useEffect(() => {
    return onUserStateChange(async (u) => {
      if (!u) {
        setUser(null);
        setWords([]);
        setEvents([]);
        return setLoading(false);
      }

      const storedToken = sessionStorage.getItem("google_access_token");
      const userData = { ...u, token: storedToken };
      setUser(userData);

      // --- MAGIC: SAVE USER TO DATABASE ---
      // This ensures they appear in your Teacher Dashboard list
      try {
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          lastLogin: serverTimestamp(), // Updates every time they log in
        }, { merge: true }); // Merge keeps existing data safe
      } catch (err) {
        console.error("Error saving user profile:", err);
      }

      setLoading(false);
    });
  }, []);

  // 2. DATA LISTENERS (For Students Only)
  useEffect(() => {
    if (!user) return;
    
    // If it's the teacher, we don't need to load the student's personal data streams
    if (user.email && user.email.toLowerCase() === TEACHER_EMAIL.toLowerCase()) return;

    // Listen to Word Bank
    const wordsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank');
    const qWords = query(wordsRef, orderBy('createdAt', 'desc'));
    const unsubWords = onSnapshot(qWords, (snap) => {
      setWords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen to Events
    const eventsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'events');
    const unsubEvents = onSnapshot(eventsRef, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubWords(); unsubEvents(); };
  }, [user]);


  // --- VIEW RENDERING ---

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#02040a] text-slate-400">
      <div className="animate-pulse">Loading LenguaHub...</div>
    </div>
  );

  if (!user) return <Login />;

  // --- TEACHER MODE CHECK ---
  // Case-insensitive check to ensure it catches your email
  if (user.email && user.email.toLowerCase() === TEACHER_EMAIL.toLowerCase()) {
    console.log("Teacher Mode Activated for:", user.email);
    return <TeacherDashboard user={user} logout={logout} />;
  }

  // --- STUDENT INTERFACE ---
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-[#02040a] to-[#02040a] text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar (Slide-out) */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Header (Hamburger Menu) */}
      <header className="fixed top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-30 pointer-events-auto md:pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={28} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-28 p-6 md:p-10 max-w-6xl mx-auto min-h-screen pb-24">
        <div className="fade-in-enter">
          {activeTab === 'home' && <Dashboard user={user} words={words} events={events} setTab={setActiveTab} />}
          {activeTab === 'words' && <WordBank user={user} words={words} />}
          {activeTab === 'calendar' && <CalendarView user={user} events={events} setEvents={setEvents} setTab={setActiveTab} />}
          {activeTab === 'study' && <Study words={words} />}
          {activeTab === 'tools' && <Tools user={user} />}
        </div>
      </main>

    </div>
  );
}
