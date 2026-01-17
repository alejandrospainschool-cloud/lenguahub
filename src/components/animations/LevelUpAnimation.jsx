// src/components/animations/LevelUpAnimation.jsx
import React, { useEffect, useState } from 'react'
import { Sparkles, Crown, Zap } from 'lucide-react'

export default function LevelUpAnimation({ level, isVisible, onComplete }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!isVisible) return

    // Generate confetti particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1,
    }))
    setParticles(newParticles)

    // Auto-close after animation
    const timer = setTimeout(() => {
      onComplete()
    }, 3500)

    return () => clearTimeout(timer)
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Main level up card - center of screen */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative animate-in zoom-in-50 spin-in duration-500">
          {/* Outer glow rings */}
          <div className="absolute inset-0 -m-8 rounded-full border-2 border-yellow-400/30 animate-pulse" />
          <div className="absolute inset-0 -m-4 rounded-full border-2 border-amber-400/50 animate-pulse" style={{ animationDelay: '0.2s' }} />

          {/* Main card */}
          <div className="relative w-80 h-96 bg-gradient-to-br from-amber-900/80 via-yellow-900/60 to-orange-900/80 backdrop-blur-xl rounded-2xl border-2 border-yellow-400/60 p-8 shadow-2xl transform -rotate-0">
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />

            {/* Content */}
            <div className="relative z-10 space-y-6 flex flex-col items-center justify-center h-full">
              {/* Crown icon at top */}
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/40 blur-2xl rounded-full animate-pulse" />
                <Crown size={64} className="text-yellow-300 animate-bounce" style={{ animationDuration: '1s' }} />
              </div>

              {/* Level text */}
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-yellow-200 tracking-widest uppercase">Level Up!</p>
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 animate-pulse">
                  {level}
                </p>
              </div>

              {/* Congratulations text */}
              <p className="text-center text-lg font-bold text-yellow-100 drop-shadow-lg">
                Congratulations! 🎉
              </p>

              {/* Subtext */}
              <p className="text-center text-sm text-yellow-200/80 max-w-xs">
                You've reached a new milestone in your learning journey!
              </p>

              {/* Stars below */}
              <div className="flex gap-2 justify-center mt-4">
                {[0, 1, 2].map((i) => (
                  <Sparkles
                    key={i}
                    size={24}
                    className="text-yellow-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Floating elements around card */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full pointer-events-none"
          style={{
            left: `${particle.left}%`,
            top: '50%',
            animation: `particle-rise ${particle.duration}s ease-out forwards`,
            animationDelay: `${particle.delay}s`,
            opacity: Math.random() > 0.5 ? 1 : 0.6,
          }}
        >
          <style>{`
            @keyframes particle-rise {
              0% {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(-${400 + Math.random() * 200}px) translateX(${(Math.random() - 0.5) * 100}px) scale(0);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ))}

      {/* Zap animations around */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`zap-${i}`}
          className="absolute animate-pulse"
          style={{
            left: `${25 + i * 20}%`,
            top: `${15 + (i % 2) * 70}%`,
          }}
        >
          <Zap
            size={32}
            className="text-yellow-400/60"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.6))',
              animation: 'float 4s ease-in-out infinite',
              animationDelay: `${i * 0.3}s`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
