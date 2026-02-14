// src/modules/words/WordBank.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Lock, Folder, ArrowLeft, MoreHorizontal, 
  Trash2, Edit2, Palette, FolderPlus, X, Check
} from 'lucide-react';
import { addDoc, collection, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { hasReachedLimit } from '../../lib/freemium'; // Import helper

// Predefined Folder Colors
const FOLDER_COLORS = [
  { name: 'Blue', hex: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Purple', hex: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Green', hex: '#22c55e', bg: 'bg-green-500' },
  { name: 'Orange', hex: '#f97316', bg: 'bg-orange-500' },
  { name: 'Pink', hex: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Red', hex: '#ef4444', bg: 'bg-red-500' },
  { name: 'Slate', hex: '#64748b', bg: 'bg-slate-500' },
];

export default function WordBank({ 
  user, words = [], 
  isPremium, dailyUsage, trackUsage, onUpgrade 
}) {
  // Navigation & UI State
  const [currentFolder, setCurrentFolder] = useState(null); 
  const [viewMode, setViewMode] = useState('folders'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null); 

  // Modals
  const [modalMode, setModalMode] = useState(null); // 'add_word', 'add_folder', 'edit_word'
  const [editTarget, setEditTarget] = useState(null); 

  // Form States
  const [folderForm, setFolderForm] = useState({ name: '', color: FOLDER_COLORS[0] });
  const [wordForm, setWordForm] = useState({ term: '', definition: '', category: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. DATA LOGIC ---

  // Extract unique categories
  const folders = useMemo(() => {
    const map = new Map();
    words.forEach(w => {
      if (!map.has(w.category)) {
        map.set(w.category, { name: w.category, color: w.folderColor || FOLDER_COLORS[0].hex, count: 0 });
      import React from 'react';
      import SharedWordBank from './SharedWordBank';

      // WordBank now delegates to SharedWordBank for unified logic and enrichment
      export default function WordBank(props) {
        // Pass all props directly to SharedWordBank
        return <SharedWordBank {...props} />;
      }