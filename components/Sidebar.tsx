import React from 'react';
import { View } from '../App';
import { HomeIcon, CompassIcon, MessageSquareIcon, LayersIcon, TargetIcon, XIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AppLogo: React.FC = () => (
    <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-inner transform rotate-[-12deg]">
            <span className="text-white font-bold text-lg font-poppins transform rotate-[12deg]">A</span>
        </div>
        <span className="text-xl font-bold font-poppins">Alfanumrik</span>
    </div>
);

const NavButton: React.FC<{
    item: { view: View; label: string; icon: React.FC<{ className?: string }> };
    isActive: boolean;
    onClick: () => void;
}> = ({ item, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`group flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive ? 'bg-[var(--sidebar-active-bg)] text-white' : 'text-[var(--text-sidebar)] hover:bg-gray-700 hover:text-white'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        <item.icon className="w-6 h-6 mr-4 transition-transform duration-200 group-hover:scale-110" />
        <span className="font-semibold text-sm">{item.label}</span>
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, isOpen, onClose }) => {
  const { activeProfile } = useAuth();

  const navItems = [
    { view: 'home' as View, label: 'Home', icon: HomeIcon },
    { view: 'academics' as View, label: 'Academics', icon: CompassIcon },
    { view: 'assess' as View, label: 'Assess', icon: TargetIcon },
    { view: 'studio' as View, label: 'Studio', icon: LayersIcon },
    { view: 'ask' as View, label: 'AI Tutor', icon: MessageSquareIcon },
  ];
  
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-[var(--bg-sidebar)] text-white flex-shrink-0 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
      <div className="flex items-center justify-between h-16 border-b border-gray-700 px-4">
        <AppLogo />
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700/50 lg:hidden">
            <XIcon className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => (
          <NavButton 
            key={item.view} 
            item={item} 
            isActive={activeView === item.view || (activeView === 'lesson' && item.view === 'academics')}
            onClick={() => {
                setView(item.view);
                onClose();
            }}
          />
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