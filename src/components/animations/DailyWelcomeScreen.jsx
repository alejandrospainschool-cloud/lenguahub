// src/components/animations/DailyWelcomeScreen.jsx
import React, { useEffect, useState } from 'react'
import { Sun, Sparkles, Flame, BookOpen, ArrowRight } from 'lucide-react'

export default function DailyWelcomeScreen({ userName, streak, isVisible, onDismiss }) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Stagger content appearance
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Animated background overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-slate-900/60 backdrop-blur-md"
        onClick={onDismiss}
        style={{
          animation: 'fadeIn 0.6s ease-out',
        }}
      />

      {/* Main card */}
      <div
        className="relative max-w-lg w-full z-10 transform"
        style={{
          animation: 'slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-2xl rounded-3xl border border-cyan-500/30 p-8 md:p-10 shadow-2xl overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-6">
            {/* Sun & greeting */}
            <div className={`text-center space-y-3 transform transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="inline-flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/40 blur-2xl rounded-full animate-pulse" />
                  <Sun size={56} className="text-yellow-300 relative animate-bounce" style={{ animationDuration: '1.5s' }} />
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                Good Morning!
              </h1>

              {userName && (
                <p className="text-xl text-slate-200 font-medium">
                  Welcome back, <span className="text-cyan-300 font-bold">{userName}</span>! 👋
                </p>
              )}
            </div>

            {/* Motivational message */}
            <div
              className={`text-center transform transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <p className="text-lg text-slate-300 font-semibold mb-2">
                ✨ Let's continue your learning journey today
              </p>
              <p className="text-sm text-slate-400">
                Every day brings new opportunities to expand your vocabulary and reach new heights!
              </p>
            </div>

            {/* Stats cards */}
            <div
              className={`grid grid-cols-2 gap-4 transform transition-all duration-700 delay-400 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {/* Streak card */}
              <div className="group relative p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 hover:border-orange-400/60 transition-all duration-300">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <Flame size={28} className="text-orange-300 group-hover:animate-bounce" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-200">{streak}</p>
                    <p className="text-xs text-orange-300/80 font-semibold">Day Streak</p>
                  </div>
                </div>
              </div>

              {/* Daily goal card */}
              <div className="group relative p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <BookOpen size={28} className="text-blue-300 group-hover:animate-bounce" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-200">+10</p>
                    <p className="text-xs text-blue-300/80 font-semibold">Today's Goal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sparkles decoration */}
            <div
              className={`flex justify-center gap-2 transform transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {[0, 1, 2].map((i) => (
                <Sparkles
                  key={i}
                  size={20}
                  className="text-cyan-300 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* CTA Button */}
            <div
              className={`transform transition-all duration-700 delay-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <button
                onClick={onDismiss}
                className="w-full py-3 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 group flex items-center justify-center gap-2"
              >
                Start Learning
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Dismiss hint */}
            <p className="text-xs text-slate-400 text-center">
              Click anywhere or the button to continue
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
