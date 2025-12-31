// src/App.jsx
import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

// Icons
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

// Legal Pages (NEW)
import PrivacyPolicy from './modules/legal/PrivacyPolicy'
import TermsOfService from './modules/legal/TermsOfService'

// Firebase
import { onUserStateChange, logout, db } from './lib/firebase'
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

// Freemium Helper
import { getEmptyUsage } from './lib/freemium'

// Logo Import
import logo from './logo.png' 

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

      const storedToken = sessionStorage.getItem('google_access_token')
      const userData = { ...u, token: storedToken }
      setUser(userData)

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
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Protected Routes */}
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

function StudentLayout({ user }) {
  const [words, setWords] = useState([])
  const [events, setEvents] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  // FREEMIUM STATE
  const [isPremium, setIsPremium] = useState(false)
  const [dailyUsage, setDailyUsage] = useState(getEmptyUsage())

  useEffect(() => setIsSidebarOpen(false), [location])

  useEffect(() => {
    if (!user) return

    const qWords = query(
      collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank'),
      orderBy('createdAt', 'desc')
    )
    const unsubWords = onSnapshot(qWords, (snap) =>
      setWords(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )

    const eventsRef = collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'events')
    const unsubEvents = onSnapshot(eventsRef, (snap) =>
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )

    const metaRef = doc(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'settings', 'metadata')
    
    const unsubMeta = onSnapshot(metaRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setIsPremium(data.isPremium || false)

        const today = new Date().toDateString()
        if (data.usage?.date !== today) {
          const newUsage = getEmptyUsage()
          await setDoc(metaRef, { usage: newUsage }, { merge: true })
          setDailyUsage(newUsage)
        } else {
          setDailyUsage(data.usage)
        }
      } else {
        await setDoc(metaRef, { 
          isPremium: false, 
          usage: getEmptyUsage() 
        })
      }
    })

    return () => {
      unsubWords()
      unsubEvents()
      unsubMeta()
    }
  }, [user])

  const trackUsage = async (metricKey) => {
    if (isPremium) return 

    setDailyUsage(prev => ({ ...prev, [metricKey]: (prev[metricKey] || 0) + 1 }))

    try {
      const metaRef = doc(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'settings', 'metadata')
      await updateDoc(metaRef, {
        [`usage.${metricKey}`]: increment(1)
      })
    } catch (err) {
      console.error("Usage tracking failed:", err)
    }
  }

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; 
      } else {
        console.error("Stripe Error:", data);
        alert("Failed to start checkout. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong with the payment server. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* UPDATED MOBILE HEADER */}
      <header className="fixed top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-30 md:hidden bg-[#02040a]/80 backdrop-blur-md border-b border-white/5">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
          <Menu size={28} />
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="Olé Learning" className="h-8 w-8 rounded-lg shadow-lg shadow-amber-500/20" />
          <span className="font-bold text-lg text-slate-200">Olé Learning</span>
        </div>
      </header>

      <Sidebar user={user} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

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
            <Route path="/words" element={
              <WordBank 
                user={user} 
                words={words} 
                isPremium={isPremium}
                dailyUsage={dailyUsage}
                trackUsage={trackUsage}
                onUpgrade={handleUpgrade}
              />
            } />
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
            <Route path="/tools" element={
              <Tools 
                user={user} 
                isPremium={isPremium}
                dailyUsage={dailyUsage}
                trackUsage={trackUsage}
                onUpgrade={handleUpgrade}
              />
            } />
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