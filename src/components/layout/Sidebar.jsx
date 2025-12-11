import React from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Book, LogOut, PlusCircle, User, X, Brain, Sparkles, GraduationCap } from 'lucide-react';
import { logout } from '../../lib/firebase';

const NavItem = ({ icon, label, active, onClick, isAction = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
    ${isAction 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 mt-4 mb-2' 
      : active 
        ? 'bg-slate-800 text-white border border-white/10' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {React.cloneElement(icon, { size: 20 })}
    <span className={`font-medium text-sm ${isAction ? 'font-bold' : ''}`}>{label}</span>
  </button>
);

export default function Sidebar({ user, activeTab, setActiveTab, isOpen, onClose }) {
  
  const handleLogout = () => {
    // Hard Logout: Clear tokens to prevent "Ghost Calendar" issues
    sessionStorage.removeItem("google_access_token");
    logout();
    window.location.reload();
  };

  return (
    <>
      {/* 1. DARK OVERLAY (Click to close) */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* 2. THE SLIDING DRAWER */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-72 bg-[#02040a] border-r border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        
        {/* Header / Close Button */}
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">LH</div>
            <span className="font-bold text-lg text-white tracking-tight">LenguaHub</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          <div className="text-xs font-bold text-slate-600 px-4 mb-2 mt-2 uppercase tracking-wider">Menu</div>
          
          <NavItem 
            icon={<LayoutGrid />} 
            label="Dashboard" 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          
          <NavItem 
            icon={<Book />} 
            label="Word Bank" 
            active={activeTab === 'words'} 
            onClick={() => setActiveTab('words')} 
          />

          <NavItem 
            icon={<CalendarIcon />} 
            label="Calendar" 
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
          />

          <NavItem 
            icon={<GraduationCap />} 
            label="Study Room" 
            active={activeTab === 'study'} 
            onClick={() => setActiveTab('study')} 
          />

          <NavItem 
            icon={<Sparkles />} 
            label="AI Tools" 
            active={activeTab === 'tools'} 
            onClick={() => setActiveTab('tools')} 
          />

          {/* Special "New Entry" Action Button */}
          <NavItem 
            isAction
            icon={<PlusCircle />} 
            label="New Entry" 
            onClick={() => setActiveTab('words')} 
          />
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-900/20">
          <div className="flex items-center justify-between px-2 gap-2">
            
            {/* User Profile Button */}
            <button 
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors flex-1 text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30 group-hover:border-blue-400">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-white truncate">{user?.displayName || 'Student'}</div>
                <div className="text-[10px] text-slate-500 truncate">Settings</div>
              </div>
            </button>
            
            {/* Hard Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/50 rounded-lg hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}