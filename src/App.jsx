// src/App.jsx
import React, { useEffect, useState } from 'react'
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
import ForgotPassword from './modules/auth/ForgotPassword'
import Onboarding from './modules/auth/Onboarding'
import TeacherDashboard from './modules/dashboard/TeacherDashboard'
import DailyWelcomeScreen from './components/animations/DailyWelcomeScreen'

// Legal Pages
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
  getDoc,
} from 'firebase/firestore'

// Freemium Helper
import { getEmptyUsage } from './lib/freemium'

// Animation Helpers
import { 
  hasSeenDailyWelcomeToday, 
  markDailyWelcomeAsSeen
} from './lib/animationHelpers'

// Logo Import
import logo from './logo.png'

export default function App() {
  return <MainContent />
}

/**
 * Roles:
 * - admin: "god" account (can promote tutors, assign students)
 * - tutor: tutor dashboard access (only for assigned students)
 * - student: default
 */
function MainContent() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null) // "student" | "tutor" | "admin"
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [showDailyWelcome, setShowDailyWelcome] = useState(false)
  const [userStats, setUserStats] = useState(null)
  const [words, setWords] = useState([])

  useEffect(() => {
    let unsubRole = null

    const unsubAuth = onUserStateChange(async (u) => {
      // clean previous role listener
      if (unsubRole) {
        unsubRole()
        unsubRole = null
      }

      if (!u) {
        setUser(null)
        setRole(null)
        setIsGuest(false)
        setOnboardingCompleted(false)
        setCheckingOnboarding(false)
        setLoading(false)
        return
      }

      const guestMode = !!u.isAnonymous
      setIsGuest(guestMode)

      const storedToken = sessionStorage.getItem('google_access_token')
      setUser({ ...u, token: storedToken })

      // Guests: no DB sync, force student
      if (guestMode) {
        setRole('student')
        setOnboardingCompleted(true) // Skip onboarding for guests
        setCheckingOnboarding(false)
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, 'users', u.uid)

        // Ensure root /users/{uid} exists and never overwrite role
        const snap = await getDoc(userRef)
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            photoURL: u.photoURL || '',
            role: 'student',
            onboardingCompleted: false,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          })
          setOnboardingCompleted(false)
        } else {
          const data = snap.data()
          setOnboardingCompleted(!!data.onboardingCompleted)
          
          await setDoc(
            userRef,
            {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || '',
              photoURL: u.photoURL || '',
              lastLogin: serverTimestamp(),
            },
            { merge: true }
          )
        }
        setCheckingOnboarding(false)

        // Subscribe to role changes in real-time
        unsubRole = onSnapshot(
          userRef,
          (docSnap) => {
            const data = docSnap.data()
            setRole(data?.role || 'student')
            setLoading(false)
          },
          (err) => {
            console.error('Role snapshot error:', err)
            setRole('student')
            setLoading(false)
          }
        )
      } catch (err) {
        console.error('User Sync/Role Error:', err)
        setRole('student')
        setCheckingOnboarding(false)
        setLoading(false)
      }
    })

    return () => {
      if (unsubRole) unsubRole()
      unsubAuth()
    }
  }, [])

  // Block rendering until role is known for non-guests
  if (loading || (user && !isGuest && role === null) || checkingOnboarding) return <LoadingScreen />

  // Show onboarding if user is logged in, not a guest, and hasn't completed onboarding
  if (user && !isGuest && !onboardingCompleted) {
    return (
      <Onboarding
        user={user}
        onComplete={() => setOnboardingCompleted(true)}
      />
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : role === 'admin' || role === 'tutor' ? (
            <TeacherDashboard user={user} logout={logout} role={role} />
          ) : (
            <StudentLayout user={user} isGuest={isGuest} />
          )
        }
      />
    </Routes>
  )
}

function StudentLayout({ user, isGuest }) {
  const [words, setWords] = useState([])
  const [events, setEvents] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showDailyWelcome, setShowDailyWelcome] = useState(false)
  const [streakCount, setStreakCount] = useState(0)
  const location = useLocation()

  // FREEMIUM STATE
  const [isPremium, setIsPremium] = useState(false)
  const [dailyUsage, setDailyUsage] = useState(getEmptyUsage())

  // Check if should show daily welcome
  useEffect(() => {
    if (!user || isGuest || hasSeenDailyWelcomeToday(user)) {
      return
    }

    // Show on dashboard route
    if (location.pathname === '/') {
      setShowDailyWelcome(true)
      markDailyWelcomeAsSeen(user)
    }
  }, [user, isGuest, location.pathname])

  // Calculate streak from words
  useEffect(() => {
    if (words.length === 0) {
      setStreakCount(0)
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    let checkDate = new Date(today)

    const activeDates = new Set(
      words
        .map((w) => {
          if (!w.createdAt) return null
          const d = w.createdAt.toDate?.() || new Date(w.createdAt)
          return d.toDateString()
        })
        .filter(Boolean)
    )

    if (!activeDates.has(today.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1)
      if (!activeDates.has(checkDate.toDateString())) {
        setStreakCount(0)
        return
      }
    }

    while (activeDates.has(checkDate.toDateString())) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    setStreakCount(streak)
  }, [words])

  useEffect(() => {
    if (!user || isGuest) return

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
        setIsPremium(!!data.isPremium)

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
          usage: getEmptyUsage(),
        })
      }
    })

    return () => {
      unsubWords()
      unsubEvents()
      unsubMeta()
    }
  }, [user, isGuest])

  const trackUsage = async (metricKey) => {
    if (isPremium) return

    setDailyUsage((prev) => ({ ...prev, [metricKey]: (prev[metricKey] || 0) + 1 }))

    try {
      const metaRef = doc(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'settings', 'metadata')
      await updateDoc(metaRef, {
        [`usage.${metricKey}`]: increment(1),
      })
    } catch (err) {
      console.error('Usage tracking failed:', err)
    }
  }

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Stripe Error:', data)
        alert('Failed to start checkout. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong with the payment server. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* DAILY WELCOME SCREEN */}
      <DailyWelcomeScreen
        userName={user?.displayName?.split(' ')[0] || 'Student'}
        streak={streakCount}
        isVisible={showDailyWelcome}
        onDismiss={() => setShowDailyWelcome(false)}
      />

      {/* MOBILE HEADER */}
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
            <Route
              path="/"
              element={
                <Dashboard
                  user={user}
                  words={words}
                  events={events}
                  isPremium={isPremium}
                  dailyUsage={dailyUsage}
                  trackUsage={trackUsage}
                  onUpgrade={handleUpgrade}
                />
              }
            />
            <Route
              path="/words"
              element={
                <WordBank
                  user={user}
                  words={words}
                  isPremium={isPremium}
                  dailyUsage={dailyUsage}
                  trackUsage={trackUsage}
                  onUpgrade={handleUpgrade}
                />
              }
            />
            <Route path="/calendar" element={<CalendarView user={user} events={events} setEvents={setEvents} />} />
            <Route
              path="/study"
              element={
                <Study
                  words={words}
                  isPremium={isPremium}
                  dailyUsage={dailyUsage}
                  trackUsage={trackUsage}
                  onUpgrade={handleUpgrade}
                />
              }
            />
            <Route
              path="/tools"
              element={
                <Tools
                  user={user}
                  isPremium={isPremium}
                  dailyUsage={dailyUsage}
                  trackUsage={trackUsage}
                  onUpgrade={handleUpgrade}
                />
              }
            />
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
        <div className="animate-pulse text-sm font-medium tracking-widest uppercase">Cargando Olé Learning</div>
      </div>
    </div>
  )
}
