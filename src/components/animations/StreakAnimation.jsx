// src/components/animations/StreakAnimation.jsx
import React, { useEffect } from 'react'
import { Flame } from 'lucide-react'

export default function StreakAnimation({ streak, isVisible, onComplete }) {
  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      onComplete()
    }, 2500)

    return () => clearTimeout(timer)
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
      {/* Background fade */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Main animation */}
      <div className="relative animate-in zoom-in duration-500">
        {/* Outer rings */}
        <div className="absolute inset-0 -m-6 rounded-full border-2 border-orange-400/40 animate-pulse" />
        <div className="absolute inset-0 -m-12 rounded-full border-2 border-red-400/20 animate-pulse" style={{ animationDelay: '0.3s' }} />

        {/* Main flame container */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-red-500/20 rounded-full blur-3xl animate-pulse" />

          <div className="relative">
            <Flame
              size={120}
              className="text-orange-300 animate-bounce"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(253, 124, 20, 0.8))',
                animationDuration: '0.8s',
              }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="mt-6 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <p className="text-sm font-bold text-orange-200 tracking-widest uppercase">
            Streak Active!
          </p>
          <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-300">
            {streak}
          </p>
          <p className="text-lg text-orange-100 font-bold">
            Days in a Row! 🔥
          </p>
        </div>
      </div>
    </div>
  )
}
