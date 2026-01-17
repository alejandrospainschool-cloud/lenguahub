// src/components/animations/AnimatedToast.jsx
import React, { useEffect, useState } from 'react'
import { Check, AlertCircle, Info, Zap } from 'lucide-react'

export default function AnimatedToast({ 
  message, 
  type = 'success', // 'success', 'error', 'info', 'achievement'
  isVisible, 
  onClose,
  duration = 3000 
}) {
  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const icons = {
    success: <Check size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
    achievement: <Zap size={20} />,
  }

  const styles = {
    success: {
      bg: 'from-emerald-900/80 to-teal-900/60',
      border: 'border-emerald-500/50',
      icon: 'text-emerald-300',
      text: 'text-emerald-100',
      bar: 'bg-emerald-500/60',
    },
    error: {
      bg: 'from-red-900/80 to-rose-900/60',
      border: 'border-red-500/50',
      icon: 'text-red-300',
      text: 'text-red-100',
      bar: 'bg-red-500/60',
    },
    info: {
      bg: 'from-blue-900/80 to-cyan-900/60',
      border: 'border-blue-500/50',
      icon: 'text-blue-300',
      text: 'text-blue-100',
      bar: 'bg-blue-500/60',
    },
    achievement: {
      bg: 'from-yellow-900/80 to-amber-900/60',
      border: 'border-yellow-500/50',
      icon: 'text-yellow-300',
      text: 'text-yellow-100',
      bar: 'bg-yellow-500/60',
    },
  }

  const style = styles[type] || styles.info

  return (
    <div
      className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{
        animation: isVisible 
          ? 'slideInUp 0.3s ease-out' 
          : 'slideOutDown 0.3s ease-in forwards',
      }}
    >
      <div className={`bg-gradient-to-r ${style.bg} backdrop-blur-xl border ${style.border} rounded-xl p-4 shadow-2xl max-w-sm min-w-xs overflow-hidden`}>
        {/* Progress bar */}
        <div
          className={`absolute bottom-0 left-0 h-1 ${style.bar} origin-left`}
          style={{
            animation: `shrink-width ${duration}ms linear forwards`,
            width: '100%',
          }}
        />

        <div className="flex items-start gap-3 relative z-10">
          {/* Icon */}
          <div className={`flex-shrink-0 mt-0.5 ${style.icon}`}>
            {icons[type]}
          </div>

          {/* Message */}
          <div className="flex-1">
            <p className={`${style.text} font-medium leading-snug`}>
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors ml-2"
          >
            ✕
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideOutDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100px);
            opacity: 0;
          }
        }

        @keyframes shrink-width {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}
