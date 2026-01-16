// src/modules/auth/Onboarding.jsx
import React, { useState } from 'react'
import { db } from '../../lib/firebase'
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react'

export default function Onboarding({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedLanguage, setSelectedLanguage] = useState('spanish')
  const [hasTutor, setHasTutor] = useState(null)
  const [interestedInTutor, setInterestedInTutor] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcomeAnimation, setWelcomeAnimation] = useState(false)

  const handleNext = async () => {
    if (currentStep === 3) {
      // Final step - save everything
      setLoading(true)
      try {
        // Update user profile with first name
        await setDoc(
          doc(db, 'users', user.uid),
          {
            firstName: firstName.trim(),
            preferredLanguage: selectedLanguage,
            onboardingCompleted: true,
            completedAt: serverTimestamp(),
          },
          { merge: true }
        )

        // Notify admin if user wants a tutor
        if (hasTutor === true || interestedInTutor === true) {
          try {
            const notificationsRef = collection(db, 'notifications')
            await addDoc(notificationsRef, {
              type: 'tutor_request',
              userId: user.uid,
              userEmail: user.email,
              userName: firstName.trim() || user.displayName || 'Unknown',
              message: hasTutor === true ? 'User has existing tutor' : 'User interested in tutor assignment',
              status: 'pending',
              createdAt: serverTimestamp(),
            })
          } catch (notifErr) {
            console.error('Failed to create notification:', notifErr)
          }
        }

        // Trigger welcome animation
        setWelcomeAnimation(true)
        
        // Wait for animation then complete
        setTimeout(() => {
          onComplete()
        }, 2000)
      } catch (err) {
        console.error('Onboarding error:', err)
        setLoading(false)
      }
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedStep1 = selectedLanguage !== null
  const canProceedStep2 = hasTutor !== null && (hasTutor === true || interestedInTutor !== null)
  const canProceedStep3 = firstName.trim().length > 0

  if (welcomeAnimation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-500 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Welcome message */}
        <div className="relative z-10 text-center space-y-6 px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-cyan-400/50 mb-4 animate-pulse-glow">
            <Check size={48} className="text-cyan-300 animate-bounce" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
              Olé Learning!
            </span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-md mx-auto leading-relaxed">
            You're all set, {firstName}. Let's start your Spanish learning journey! 🎉
          </p>

          <div className="flex items-center justify-center gap-2 text-cyan-400 font-semibold">
            <Sparkles size={20} />
            <span>Redirecting you to your dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100 font-sans flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-slate-400">Step {currentStep} of 3</span>
            <div className="flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 w-12 rounded-full transition-all duration-300 ${
                    step <= currentStep
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      : 'bg-slate-700/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-br from-slate-900/70 to-slate-800/50 backdrop-blur-2xl border border-blue-500/20 rounded-3xl p-8 md:p-10 shadow-2xl shadow-blue-500/10">
          {/* Step 1: Language Selection */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  What language do you want to learn?
                </h2>
                <p className="text-slate-400 text-lg">
                  Choose your learning path and let's get started!
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setSelectedLanguage('spanish')}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group ${
                    selectedLanguage === 'spanish'
                      ? 'bg-gradient-to-r from-red-600/25 to-yellow-600/15 border-red-400/50 shadow-lg shadow-red-500/20'
                      : 'bg-slate-800/30 border-slate-700/40 hover:border-red-400/30 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-5xl">🇪🇸</div>
                  <div className="flex-1 text-left">
                    <div className="text-2xl font-bold text-white group-hover:text-red-300 transition-colors">
                      Spanish
                    </div>
                    <div className="text-sm text-slate-400">¡Aprende español! • Learn Spanish</div>
                  </div>
                  {selectedLanguage === 'spanish' && (
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>
              </div>

              <p className="text-sm text-slate-500 text-center">
                More languages coming soon! 🌍
              </p>
            </div>
          )}

          {/* Step 2: Tutor Question */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Do you have a tutor on Olé Learning?
                </h2>
                <p className="text-slate-400 text-lg">
                  Personal guidance can accelerate your learning!
                </p>
              </div>

              <div className="space-y-4">
                {/* Yes Button */}
                <button
                  onClick={() => setHasTutor(true)}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 ${
                    hasTutor === true
                      ? 'bg-gradient-to-r from-blue-600/25 to-cyan-600/15 border-blue-400/50 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/30 border-slate-700/40 hover:border-blue-400/30 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-xl font-bold text-white text-left">Yes, I have a tutor</div>
                  <div className="text-sm text-slate-400 text-left mt-1">
                    Admin will help assign you to the right tutor
                  </div>
                </button>

                {/* No Button */}
                <button
                  onClick={() => setHasTutor(false)}
                  className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 ${
                    hasTutor === false
                      ? 'bg-gradient-to-r from-slate-700/25 to-slate-600/15 border-slate-400/50 shadow-lg shadow-slate-500/20'
                      : 'bg-slate-800/30 border-slate-700/40 hover:border-slate-400/30 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-xl font-bold text-white text-left">No, I don't have a tutor</div>
                  <div className="text-sm text-slate-400 text-left mt-1">
                    I'll learn independently
                  </div>
                </button>
              </div>

              {/* Conditional: If no tutor, ask about interest */}
              {hasTutor === false && (
                <div className="space-y-3 pt-4 border-t border-slate-700/50 animate-in fade-in duration-300">
                  <p className="text-slate-300 font-medium">
                    Would you be interested in getting a tutor to accelerate your progress?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setInterestedInTutor(true)}
                      className={`flex-1 py-3 rounded-lg border-2 font-semibold transition-all ${
                        interestedInTutor === true
                          ? 'bg-emerald-600/20 border-emerald-400/50 text-emerald-300'
                          : 'bg-slate-800/30 border-slate-700/40 hover:border-emerald-400/30 text-slate-300 hover:text-emerald-300'
                      }`}
                    >
                      Yes!
                    </button>
                    <button
                      onClick={() => setInterestedInTutor(false)}
                      className={`flex-1 py-3 rounded-lg border-2 font-semibold transition-all ${
                        interestedInTutor === false
                          ? 'bg-slate-700/30 border-slate-400/50 text-slate-300'
                          : 'bg-slate-800/30 border-slate-700/40 hover:border-slate-400/30 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      No thanks
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: First Name */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  What's your first name?
                </h2>
                <p className="text-slate-400 text-lg">
                  We'd love to personalize your experience!
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canProceedStep3 && handleNext()}
                  placeholder="Enter your first name..."
                  autoFocus
                  className="w-full px-6 py-4 bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-blue-500/20 hover:border-blue-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 text-lg"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-200">
                  ✨ Your name will appear in the dashboard and help us personalize your learning experience!
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-10 pt-6 border-t border-slate-700/50">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 flex items-center gap-2 rounded-xl border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={
                loading ||
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canProceedStep2) ||
                (currentStep === 3 && !canProceedStep3)
              }
              className="flex-1 px-6 py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600/25 to-cyan-500/15 hover:from-blue-600/35 hover:to-cyan-500/25 border border-blue-400/40 hover:border-cyan-400/60 text-blue-300 hover:text-cyan-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Setting up...
                </>
              ) : (
                <>
                  {currentStep === 3 ? 'Complete Onboarding' : 'Next'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step indicator text */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          {currentStep === 1 && 'Step 1: Choose your language'}
          {currentStep === 2 && 'Step 2: Tell us about your tutor'}
          {currentStep === 3 && 'Step 3: Personalize your profile'}
        </div>
      </div>
    </div>
  )
}
