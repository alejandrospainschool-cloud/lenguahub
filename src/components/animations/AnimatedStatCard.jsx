// src/components/animations/AnimatedStatCard.jsx
import React from 'react'

export default function AnimatedStatCard({ 
  icon: Icon, 
  title, 
  value, 
  description, 
  color = 'blue',
  trend,
  onClick
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-400/30 text-blue-300',
    purple: 'from-purple-500/20 to-pink-500/10 border-purple-400/30 text-purple-300',
    orange: 'from-orange-500/20 to-red-500/10 border-orange-400/30 text-orange-300',
    green: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/30 text-emerald-300',
    yellow: 'from-yellow-500/20 to-amber-500/10 border-yellow-400/30 text-yellow-300',
  }

  const classes = colorClasses[color] || colorClasses.blue

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
        onClick ? 'hover:shadow-lg hover:shadow-blue-500/20' : ''
      }`}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${classes} backdrop-blur-xl border transition-all duration-300 group-hover:shadow-xl`} />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl bg-gradient-to-br from-${color}-500/30 to-${color}-600/20 group-hover:from-${color}-500/50 group-hover:to-${color}-600/40 transition-all duration-300`}>
            <Icon size={24} className={`text-${color}-300`} />
          </div>
          {trend && (
            <div className={`text-sm font-bold px-2 py-1 rounded-lg ${
              trend > 0 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                : 'bg-red-500/20 text-red-300 border border-red-400/30'
            }`}>
              {trend > 0 ? '+' : ''}{trend}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1 group-hover:scale-110 transition-transform duration-300 origin-left">
            {value}
          </p>
        </div>

        {description && (
          <p className="text-xs text-slate-300 font-medium">{description}</p>
        )}
      </div>

      {/* Shimmer on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-2xl" />
      </div>
    </div>
  )
}
