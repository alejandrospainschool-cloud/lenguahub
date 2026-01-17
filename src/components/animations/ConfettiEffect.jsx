// src/components/animations/ConfettiEffect.jsx
import React, { useEffect, useState } from 'react'

export default function ConfettiEffect({ trigger = false }) {
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    if (!trigger) return

    // Generate confetti pieces
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1.5,
      color: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
    }))

    setConfetti(pieces)

    // Clear after animation
    const timer = setTimeout(() => {
      setConfetti([])
    }, 4000)

    return () => clearTimeout(timer)
  }, [trigger])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 pointer-events-none"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            background: piece.color,
            borderRadius: '50%',
            animation: `confetti-fall ${piece.duration}s ease-out forwards`,
            animationDelay: `${piece.delay}s`,
            boxShadow: `0 0 10px ${piece.color}`,
          }}
        >
          <style>{`
            @keyframes confetti-fall {
              0% {
                transform: translateY(0) rotateZ(0deg) scale(1);
                opacity: 1;
              }
              100% {
                transform: translateY(${window.innerHeight + 100}px) rotateZ(${piece.rotation}deg) scale(0);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ))}
    </div>
  )
}
