// src/modules/words/SharedWordBank.jsx
import React, { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Search,
  Folder,
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Edit2,
  FolderPlus,
  X,
} from 'lucide-react'
import { addDoc, collection, serverTimestamp, doc, deleteDoc, updateDoc, onSnapshot, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Predefined Folder Colors
const FOLDER_COLORS = [
  { name: 'Blue', hex: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Purple', hex: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Green', hex: '#22c55e', bg: 'bg-green-500' },
  { name: 'Orange', hex: '#f97316', bg: 'bg-orange-500' },
  { name: 'Pink', hex: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Red', hex: '#ef4444', bg: 'bg-red-500' },
  { name: 'Slate', hex: '#64748b', bg: 'bg-slate-500' },
]

/**
 * SharedWordBank - Unified word bank view for both students and tutors
 * Can be used in student's personal dashboard or teacher dashboard
 * @param {Object} props
 * @param {Object} props.user - Current user object
 * @param {Array} props.words - Word list (optional if studentUid provided)
 * @param {string} props.studentUid - Student UID (for teacher viewing student's bank)
 * @param {boolean} props.isTeacherView - Whether tutor is viewing/editing
 * @param {Function} props.onBack - Callback for back button
 */
export default function SharedWordBank({
  user,
  words: initialWords = [],
  studentUid,
  isTeacherView = false,
  onBack = null,
}) {
  // Load words from Firestore if not provided
  const [loadedWords, setLoadedWords] = useState(initialWords)

  useEffect(() => {
    const targetUid = studentUid || user?.uid
    if (!targetUid) return

    const q = query(collection(db, 'artifacts', 'language-hub-v2', 'users', targetUid, 'wordbank'))
    const unsub = onSnapshot(q, (snapshot) => {
      setLoadedWords(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [studentUid, user?.uid])

  const words = loadedWords

  // Navigation & UI State
  const [currentFolder, setCurrentFolder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)

  // Modals
  const [modalMode, setModalMode] = useState(null) // 'add_word', 'add_folder', 'edit_word'
  const [editTarget, setEditTarget] = useState(null)

  // Form States
  const [folderForm, setFolderForm] = useState({ name: '', color: FOLDER_COLORS[0] })
  const [wordForm, setWordForm] = useState({
    term: '',
    definition: '',
    translation: '',
    category: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Extract unique categories/folders
  const folders = useMemo(() => {
    const map = new Map()
    words.forEach((w) => {
      const category = w.category || 'Uncategorized'
      if (!map.has(category)) {
        map.set(category, {
          name: category,
          color: w.folderColor || FOLDER_COLORS[0].hex,
          count: 0,
        })
      }
      const folder = map.get(category)
      folder.count += 1
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [words])

  const targetUid = studentUid || user?.uid

  return (
    <div className="max-w-6xl mx-auto min-h-[80vh] flex flex-col animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 pt-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {currentFolder && !searchTerm && (
            <button
              onClick={() => setCurrentFolder(null)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {searchTerm
                ? 'Search'
                : currentFolder?.name
                  ? currentFolder.name
                  : isTeacherView
                    ? 'Student Word Bank'
                    : 'My Collections'}
            </h1>
            <p className="text-slate-400 text-sm">
              {currentFolder ? `${visibleWords.length} words` : 'Organize your vocabulary'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setModalMode('add_folder')}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-white/5 transition-colors"
            title="New Folder"
          >
            <FolderPlus size={20} />
          </button>
          <button
            onClick={() => {
              setWordForm((prev) => ({ ...prev, category: currentFolder?.name || '' }))
              setModalMode('add_word')
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Word</span>
          </button>
        </div>
      </div>

      {/* --- VIEW: FOLDERS --- */}
      {!currentFolder && !searchTerm && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => setCurrentFolder(folder)}
              className="group relative flex flex-col items-start p-6 bg-slate-900/40 border border-white/5 rounded-3xl transition-all duration-300 hover:bg-slate-800/60"
              style={{ borderColor: `${folder.color}33` }}
            >
              <div
                className="mb-4 p-3 rounded-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
              >
                <Folder size={28} fill="currentColor" className="opacity-80" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">{folder.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{folder.count} words</p>
            </button>
          ))}

          {folders.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-3xl">
              <p className="text-slate-500">
                No collections found. {isTeacherView ? 'Create a folder to add words.' : 'Create a folder to get started.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* --- VIEW: WORD LIST --- */}
      {(currentFolder || searchTerm) && (
        <div className="space-y-3">
          {visibleWords.map((word) => (
            <div
              key={word.id}
              className="group relative flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-2xl hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-1.5 h-10 rounded-full"
                  style={{ backgroundColor: word.folderColor || '#3b82f6' }}
                />
                <div>
                  <h4 className="text-lg font-bold text-white">{word.term}</h4>
                  <p className="text-slate-400 text-sm">
                    {word.definition || word.translation}
                  </p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === word.id ? null : word.id)}
                  className="p-2 text-slate-600 hover:text-white transition-colors"
                >
                  <MoreHorizontal size={20} />
                </button>

                {activeMenu === word.id && (
                  <div className="absolute right-0 top-full mt-2 w-32 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                    <button
                      onClick={() => openEditModal(word)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white text-left"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 text-left"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {activeMenu && (
            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
          )}
        </div>
      )}

      {/* --- MODAL: CREATE FOLDER --- */}
      {modalMode === 'add_folder' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">New Collection</h2>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Name</label>
                <input
                  autoFocus
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Verbs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">
                  Color Code
                </label>
                <div className="flex gap-2 flex-wrap">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setFolderForm({ ...folderForm, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${c.bg} ${
                        folderForm.color.name === c.name
                          ? 'border-white scale-110'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button className="w-full py-3 bg-slate-200 hover:bg-white text-slate-900 font-bold rounded-xl mt-4">
                Create & Add First Word
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT WORD --- */}
      {(modalMode === 'add_word' || modalMode === 'edit_word') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">
              {modalMode === 'edit_word' ? 'Edit Word' : 'New Word'}
            </h2>

            <form onSubmit={handleSaveWord} className="space-y-4 mt-4">
              {/* Folder Selection */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Folder</label>
                <div className="grid grid-cols-2 gap-2 mt-1 max-h-32 overflow-y-auto pr-1">
                  {folders.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setWordForm({ ...wordForm, category: f.name })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                        wordForm.category === f.name
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      closeModal()
                      setModalMode('add_folder')
                    }}
                    className="px-3 py-2 rounded-lg border border-dashed border-slate-700 text-slate-500 text-sm hover:text-white hover:border-slate-500"
                  >
                    + New Folder
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Term</label>
                <input
                  value={wordForm.term}
                  onChange={(e) => setWordForm({ ...wordForm, term: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder={isTeacherView ? 'e.g. Bonjour' : 'e.g. Spanish word'}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Definition
                  {isTeacherView && ' (or Translation)'}
                </label>
                <input
                  value={wordForm.definition}
                  onChange={(e) => setWordForm({ ...wordForm, definition: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  placeholder={isTeacherView ? 'e.g. Hello' : 'e.g. Definition'}
                />
              </div>

              {isTeacherView && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                    Translation (Optional)
                  </label>
                  <input
                    value={wordForm.translation}
                    onChange={(e) => setWordForm({ ...wordForm, translation: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. English translation"
                  />
                </div>
              )}

              <button
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg mt-2"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
