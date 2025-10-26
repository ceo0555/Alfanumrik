import React from 'react';
import { View } from '../App';
import { HomeIcon, CompassIcon, CalendarDaysIcon, MessageSquareIcon, MicrophoneIcon, WandIcon, ClipboardListIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView }) => {
  const { activeProfile } = useAuth();

  const navItems = [
    { view: 'home' as View, label: 'Home', icon: HomeIcon },
    { view: 'learn' as View, label: 'Learn', icon: CompassIcon },
    { view: 'assignments' as View, label: 'Assignments', icon: ClipboardListIcon },
    { view: 'planner' as View, label: 'Planner', icon: CalendarDaysIcon },
    { view: 'ask' as View, label: 'AI Tutor', icon: MessageSquareIcon },
    { view: 'tutor' as View, label: 'Tutor', icon: MicrophoneIcon },
    { view: 'tools' as View, label: 'AI Studio', icon: WandIcon },
  ];

  const NavButton: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = activeView === item.view || (activeView === 'lesson' && item.view === 'learn');
    return (
      <button
        onClick={() => setView(item.view)}
        className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive ? 'bg-[var(--sidebar-active-bg)] text-white' : 'text-[var(--text-sidebar)] hover:bg-gray-700 hover:text-white'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon className="w-6 h-6 mr-4" />
        <span className="font-semibold text-sm">{item.label}</span>
      </button>
    );
  };
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-sidebar)] text-white flex-shrink-0">
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-inner transform rotate-[-12deg]">
                <span className="text-white font-bold text-lg font-poppins transform rotate-[12deg]">A</span>
            </div>
            <span className="text-xl font-bold font-poppins">Alfanumrik</span>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => (
          <NavButton key={item.view} item={item} />
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-lg flex-shrink-0 ring-2 ring-gray-600">
                {activeProfile?.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="font-semibold text-sm text-white">{activeProfile?.name}</p>
                <p className="text-xs text-gray-400">Level {activeProfile?.level} &middot; Class {activeProfile?.grade}</p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;