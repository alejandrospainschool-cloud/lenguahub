// src/modules/study/Practice.jsx
import React, { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import SentencePractice from '../words/SentencePractice'

export default function Practice({ words = [], onBack = null }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showPractice, setShowPractice] = useState(false)

  // Get unique categories from words
  const categories = useMemo(() => {
    const map = new Map()
    words.forEach(w => {
      const cat = w.category || 'Uncategorized'
      if (!map.has(cat)) {
        map.set(cat, { name: cat, color: w.folderColor || '#3b82f6', count: 0 })
      }
      map.get(cat).count++
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [words])

  // Filter words based on search and category
  const practiceWords = useMemo(() => {
    return words.filter(w => {
      const matchesSearch = searchTerm
        ? (w.term || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (w.primaryDefinition || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true
      const matchesCategory = selectedCategory ? w.category === selectedCategory.name : true
      return matchesSearch && matchesCategory
    })
  }, [words, searchTerm, selectedCategory])

  // If no words, show empty state
  if (words.length === 0) {
    return (
      <div className="w-full mx-auto px-4 md:px-8 min-h-[60vh] flex flex-col pb-12">
        <div className="flex items-center gap-3 min-w-0 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Practice</h1>
            <p className="text-slate-500 text-sm mt-0.5">Build your vocabulary and test your knowledge</p>
          </div>
        </div>

        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">No words to practice yet</p>
          <p className="text-slate-600 text-xs">Add words to your Word Bank to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto px-4 md:px-8 min-h-[60vh] flex flex-col pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Practice</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {selectedCategory
                ? `${practiceWords.length} word${practiceWords.length !== 1 ? 's' : ''} in ${selectedCategory.name}`
                : `${practiceWords.length} word${practiceWords.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={15} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search words..."
              className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-9 pr-8 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-600 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="mb-8 pb-6 border-b border-white/5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Collections</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              All ({words.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  selectedCategory?.name === cat.name
                    ? 'text-white shadow-lg border'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
                }`}
                style={selectedCategory?.name === cat.name ? {
                  backgroundColor: `${cat.color}20`,
                  borderColor: `${cat.color}50`
                } : {}}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ background: cat.color }} 
                />
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Practice Section */}
      {practiceWords.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-medium">
            {searchTerm ? `No words matching "${searchTerm}"` : 'No words in this collection'}
          </p>
        </div>
      ) : (
        <button
          onClick={() => setShowPractice(true)}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-[.97] transition-all mt-8"
        >
          <span>🚀</span>
          Start Practice
        </button>
      )}

      {/* Practice Modal */}
      {showPractice && (
        <SentencePractice
          words={practiceWords}
          onClose={() => setShowPractice(false)}
        />
      )}
    </div>
  )
}
