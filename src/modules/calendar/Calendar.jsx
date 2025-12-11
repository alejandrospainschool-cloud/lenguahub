import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
// FIX 1: Import the correct function name
import { createGoogleCalendarEvent } from '../../lib/googleCalendar'; 

export default function CalendarView({ user, events = [], setEvents, setTab }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '12:00' });

  // --- Date Helpers ---
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  // --- HANDLER: Add Event + Sync to Google ---
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    setIsSyncing(true);

    try {
      // 1. Save to Google Calendar (Real Sync)
      if (user.token) {
        // FIX 2: Correct argument order (Token first, then Event)
        await createGoogleCalendarEvent(user.token, newEvent);
        console.log("Synced to Google Calendar!");
      } else {
        console.warn("No Google Token found. Event saved locally only.");
      }

      // 2. Save to Firebase (App Database)
      const docRef = await addDoc(collection(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'events'), newEvent);
      
      // 3. Update UI
      // We check if setEvents is a function before calling it (it might not be passed in Teacher view)
      if (typeof setEvents === 'function') {
        setEvents([...events, { ...newEvent, id: docRef.id }]);
      }
      
      setShowAdd(false);
      setNewEvent({ title: '', date: '', time: '12:00' });

    } catch (error) {
      alert("Note: Saved to app, but Google Calendar sync failed. (Did you approve permissions?)");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    
    if (typeof setEvents === 'function') {
      setEvents(events.filter(e => e.id !== id));
    }

    try {
      await deleteDoc(doc(db, 'artifacts', 'language-hub-v2', 'users', user.uid, 'events', id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-slate-900/30 border-r border-b border-white/5" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      days.push(
        <div key={day} className={`min-h-[100px] p-2 border-r border-b border-white/5 relative group transition-colors hover:bg-white/5 ${isToday ? 'bg-blue-500/10' : 'bg-slate-900/50'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
              {day}
            </span>
            <button 
              onClick={() => { setNewEvent({ ...newEvent, date: dateStr }); setShowAdd(true); }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 transition-opacity"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1">
            {dayEvents.map((event, idx) => (
              <div key={idx} className="group/event text-xs bg-blue-600/20 border border-blue-500/30 text-blue-200 p-1.5 rounded-lg truncate relative cursor-pointer hover:bg-blue-600 hover:text-white transition-colors">
                <div className="font-semibold truncate">{event.title}</div>
                <div className="opacity-75 text-[10px]">{event.time}</div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                  className="absolute top-1 right-1 opacity-0 group-hover/event:opacity-100 text-blue-200 hover:text-white"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Only show Back button if setTab is provided (Student View) */}
          {typeof setTab === 'function' && (
            <button onClick={() => setTab('home')} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-white/5">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">Schedule</h2>
            <p className="text-slate-400 text-sm">Manage your sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/50 p-1 rounded-xl border border-white/10">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-slate-200 min-w-[140px] text-center select-none">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} /> <span className="hidden sm:inline">Add Event</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40 backdrop-blur-xl">
        <div className="grid grid-cols-7 border-b border-white/10 bg-slate-900/80">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-slate-900/20">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-slate-700 p-6 rounded-3xl shadow-2xl w-full max-w-sm relative">
            
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CalendarIcon className="text-blue-500" /> New Session
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Title</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white mt-1 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Spanish Lesson"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white mt-1 focus:outline-none focus:border-blue-500"
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Time</label>
                  <input 
                    type="time"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white mt-1 focus:outline-none focus:border-blue-500"
                    value={newEvent.time}
                    onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSyncing}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSyncing ? 'Syncing...' : 'Book & Sync'}
                </button>
              </div>
              
              <p className="text-[10px] text-center text-slate-500 mt-2">
                This will automatically add to your Google Calendar.
              </p>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}