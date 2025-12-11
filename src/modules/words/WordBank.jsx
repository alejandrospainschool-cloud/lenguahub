// src/modules/words/WordBank.jsx
import React, { useState, useEffect } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Plus, Trash2, Tag, X, BookOpen, FolderPlus, Folder } from 'lucide-react';

export default function WordBank({ user, words = [] }) {
  // --- STATES ---
  const [showAddWord, setShowAddWord] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data States
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('All'); // Filter by group

  // Form States
  const [newWord, setNewWord] = useState({ term: '', translation: '', category: 'General' });
  const [newGroupName, setNewGroupName] = useState('');

  // --- LISTEN FOR GROUPS (Real-time) ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'groups'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // --- FILTER LOGIC ---
  const filteredWords = words.filter(w => {
    const matchesSearch = w.term?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.translation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || w.category === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // --- HANDLERS ---
  const handleAddWord = async (e) => {
    e.preventDefault();
    if (!newWord.term || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank'), {
        ...newWord,
        createdAt: serverTimestamp(),
      });
      setShowAddWord(false);
      setNewWord({ term: '', translation: '', category: 'General' });
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'groups'), {
        name: newGroupName,
        createdAt: serverTimestamp(),
      });
      setShowAddGroup(false);
      setNewGroupName('');
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWord = async (id) => {
    if(!window.confirm("Delete this word?")) return;
    await deleteDoc(doc(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'wordbank', id));
  };

  // --- RENDER ---
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 pt-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Word Bank</h1>
          <p className="text-slate-400">Your personal collection of <span className="text-cyan-400 font-bold">{words.length}</span> words.</p>
        </div>

        <div className="flex gap-3">
          {/* NEW GROUP BUTTON */}
          <button 
            onClick={() => setShowAddGroup(true)}
            className="bg-[#0f172a] border border-slate-700 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center gap-2"
          >
            <FolderPlus size={20} className="text-slate-400" /> <span className="hidden sm:inline">New Group</span>
          </button>

          {/* NEW WORD BUTTON */}
          <button 
            onClick={() => setShowAddWord(true)}
            className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-cyan-50 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} /> New Word
          </button>
        </div>
      </div>

      {/* GROUPS / TABS SCROLL */}
      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedGroup('All')}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${selectedGroup === 'All' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-[#0f172a] border-white/10 text-slate-400 hover:bg-slate-800'}`}
          >
            All Words
          </button>
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.name)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${selectedGroup === g.name ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-[#0f172a] border-white/10 text-slate-400 hover:bg-slate-800'}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 rounded-2xl blur-md group-hover:blur-lg transition-all opacity-50" />
        <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl flex items-center p-4 transition-colors focus-within:border-cyan-500/50">
          <Search className="text-slate-500 mr-3" size={24} />
          <input 
            type="text" 
            placeholder="Search your words..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent w-full text-white placeholder-slate-500 focus:outline-none text-lg"
          />
        </div>
      </div>

      {/* WORD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.length > 0 ? (
          filteredWords.map((w) => (
            <div key={w.id} className="group relative bg-[#0f172a] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.15)]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center text-cyan-400 border border-white/5">
                  <BookOpen size={20} />
                </div>
                <button onClick={() => handleDeleteWord(w.id)} className="text-slate-600 hover:text-red-400 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{w.term}</h3>
              <p className="text-cyan-200/80 text-lg font-medium mb-6">{w.translation}</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Tag size={10} /> {w.category}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white">No words found</h3>
            <p className="text-slate-400 mt-1">Add your first word to get started!</p>
          </div>
        )}
      </div>

      {/* --- MODAL: ADD WORD --- */}
      {showAddWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md relative">
            <button onClick={() => setShowAddWord(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="text-cyan-400" /> Add New Entry</h3>
            <form onSubmit={handleAddWord} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Term</label>
                <input autoFocus className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition-colors text-lg" placeholder="e.g. Bonjour" value={newWord.term} onChange={e => setNewWord({...newWord, term: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Translation</label>
                <input className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="e.g. Hello" value={newWord.translation} onChange={e => setNewWord({...newWord, translation: e.target.value})} />
              </div>
              
              {/* DYNAMIC GROUP SELECTION */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Group / Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {['General', ...groups.map(g => g.name)].slice(0, 6).map(cat => (
                    <button type="button" key={cat} onClick={() => setNewWord({...newWord, category: cat})} className={`py-2 px-1 truncate rounded-lg text-xs font-bold border ${newWord.category === cat ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 mt-4">
                {isSubmitting ? 'Saving...' : 'Save to Word Bank'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD GROUP --- */}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-sm relative">
            <button onClick={() => setShowAddGroup(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><FolderPlus className="text-slate-400" /> New Group</h3>
            <p className="text-slate-400 text-sm mb-6">Create a folder to organize your words.</p>
            
            <form onSubmit={handleAddGroup} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Group Name</label>
                <input autoFocus className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-white transition-colors text-lg" placeholder="e.g. Verbs, Travel, Food" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold transition-all active:scale-95 mt-2">
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}