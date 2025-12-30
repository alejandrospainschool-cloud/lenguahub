// src/App.jsx
import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

// Components
import Sidebar from './components/layout/Sidebar'
import Dashboard from './modules/dashboard/Dashboard'
import WordBank from './modules/words/WordBank'
import CalendarView from './modules/calendar/Calendar'
import Study from './modules/study/Study'
import Tools from './modules/ai/Tools'
import Login from './modules/auth/Login'
import TeacherDashboard from './modules/dashboard/TeacherDashboard'

// Firebase & Freemium Logic
import { onUserStateChange, logout, db } from './lib/firebase'
import { getEmptyUsage } from './lib/freemium' // Import the helper
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore'

// --- CONFIG ---
const TEACHER_EMAIL = 'alejandropotter16@gmail.com'
const isTeacher = (user) => user?.email?.toLowerCase() === TEACHER_EMAIL.toLowerCase()

export default function App() {
  return <MainContent />
}

function MainContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. AUTH LISTENER
  useEffect(() => {
    return onUserStateChange(async (u) => {
      if (!u) {
        setUser(null)
        setLoading(false)
        return
      }

      // Restore Google Token if needed
      const storedToken = sessionStorage.getItem('google_access_token')
      const userData = { ...u, token: storedToken }
      setUser(userData)

      // Sync User to DB
      try {
        await setDoc(
          doc(db, 'users', u.uid),
          {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        console.error('User Sync Error:', err)
      }

      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingScreen />

  // 2. ROUTING LOGIC
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/*"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : isTeacher(user) ? (
            <TeacherDashboard user={user} logout={logout} />
          ) : (
            <StudentLayout user={user} />
          )
        }
      />
    </Routes>
  )
}

// --- STUDENT LAYOUT & DATA FETCHING ---
function StudentLayout({ user }) {
  const [words, setWords] = useState([])
  const [events, setEvents] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // FREEMIUM STATE
  const [isPremium, setIsPremium] = useState(false)
  const [dailyUsage, setDailyUsage] = useState(getEmptyUsage())

  const location = useLocation()

  // Close sidebar automatically on mobile when route changes
  useEffect(() => setIsSidebarOpen(false), [location])

  // Fetch Data & Settings
  useEffect(() => {
    if (!user) return

    // 1. Fetch Words
    const qWords = query(
      collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank'),
      orderBy('createdAt', 'desc')
    )
    const unsubWords = onSnapshot(qWords, (snap) =>
      setWords(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )

    // 2. Fetch Events
    const eventsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'events')
    const unsubEvents = onSnapshot(eventsRef, (snap) =>
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )

    // 3. Fetch Metadata (Premium & Usage)
    const metaRef = doc(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'settings', 'metadata')
    const unsubMeta = onSnapshot(metaRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setIsPremium(data.isPremium || false)

        // Check if day has changed
        const today = new Date().toDateString()
        if (data.usage?.date !== today) {
          // Reset usage for new day
          const newUsage = getEmptyUsage()
          await setDoc(metaRef, { usage: newUsage }, { merge: true })
          setDailyUsage(newUsage)
        } else {
          setDailyUsage(data.usage)
        }
      } else {
        // Initialize if missing
        await setDoc(metaRef, { isPremium: false, usage: getEmptyUsage() })
      }
    })

    return () => {
      unsubWords()
      unsubEvents()
      unsubMeta()
    }
  }, [user])

  // --- ACTIONS ---

  // Track usage in DB
  const trackUsage = async (metricKey) => {
    if (isPremium) return // Don't track if premium

    // Optimistic UI update
    setDailyUsage(prev => ({ ...prev, [metricKey]: (prev[metricKey] || 0) + 1 }))

    // DB Update
    try {
      const metaRef = doc(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'settings', 'metadata')
      await updateDoc(metaRef, {
        [`usage.${metricKey}`]: increment(1)
      })
    } catch (err) {
      console.error("Usage tracking failed:", err)
    }
  }

  // Handle Upgrade (Mock for now)
  const handleUpgrade = async () => {
    const confirm = window.confirm("Mock Payment: Upgrade to Premium for £9.99?")
    if (confirm) {
      const metaRef = doc(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'settings', 'metadata')
      await updateDoc(metaRef, { isPremium: true })
      alert("Welcome to Premium! Unlimited access granted.")
    }
  }

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-30 md:hidden bg-[#02040a]/80 backdrop-blur-md border-b border-white/5">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
          <Menu size={28} />
        </button>
        <span className="font-bold text-lg text-slate-200">Olé Learning</span>
      </header>

      {/* Sidebar */}
      <Sidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Content Area */}
      <main className="pt-24 md:pt-10 md:pl-72 p-6 min-h-screen max-w-7xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Routes>
            <Route path="/" element={
              <Dashboard 
                user={user} 
                words={words} 
                events={events} 
                isPremium={isPremium}
                dailyUsage={dailyUsage}
                trackUsage={trackUsage}
                onUpgrade={handleUpgrade}
              />
            } />
            <Route path="/words" element={<WordBank user={user} words={words} />} />
            <Route path="/calendar" element={<CalendarView user={user} events={events} setEvents={setEvents} />} />
            <Route path="/study" element={
              <Study 
                words={words}
                isPremium={isPremium}
                dailyUsage={dailyUsage}
                trackUsage={trackUsage}
                onUpgrade={handleUpgrade}
              />
            } />
            <Route path="/tools" element={<Tools user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#02040a] text-slate-400">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <div className="animate-pulse text-sm font-medium tracking-widest uppercase">
          Cargando Olé Learning
        </div>
      </div>
    </div>
  )
}