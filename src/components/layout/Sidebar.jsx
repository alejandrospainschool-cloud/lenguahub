import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Book, 
  Calendar, 
  Brain, 
  Sparkles, 
  LogOut, 
  X 
} from 'lucide-react';
import { logout } from '../../lib/firebase';
import logo from '../../logo.png'; // IMPORTING LOGO FROM SRC

export default function Sidebar({ user, isOpen, onClose }) {
  const location = useLocation();

  // Define the menu items and their URL paths
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Word Bank', icon: Book, path: '/words' },
    { label: 'Schedule', icon: Calendar, path: '/calendar' },
    { label: 'Study Mode', icon: Brain, path: '/study' },
    { label: 'AI Tools', icon: Sparkles, path: '/tools' },
  ];

  // Helper to check if a link is active
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay (closes sidebar when clicked) */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0f172a] border-r border-white/5 z-50 
          transform transition-transform duration-300 ease-out
          md:translate-x-0 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Olé Learning" 
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-amber-500/20" 
            />
            <span className="font-bold text-lg text-white tracking-tight">
              Olé Learning
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-4 space-y-2">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">
            Menú
          </p>
          
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onClose()} // Close sidebar on mobile when link clicked
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive(item.path) 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20 font-medium' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon 
                size={20} 
                className={isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} 
              />
              <span>{item.label}</span>
              
              {/* Active Indicator Dot */}
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
              )}
            </Link>
          ))}
        </div>

        {/* Footer / Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#0f172a]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-white/5">
            <img 
              src={user?.photoURL || "https://ui-avatars.com/api/?name=User&background=random"} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border border-slate-700"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {user?.displayName || 'Student'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {user?.email}
              </p>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-slate-500"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}