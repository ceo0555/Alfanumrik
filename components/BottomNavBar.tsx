import React from 'react';
import { View } from '../App';
import { HomeIcon, CompassIcon, MessageSquareIcon, GridIcon, TargetIcon, ScholarCoinIcon } from '../constants/icons';

interface BottomNavBarProps {
  activeView: View;
  setView: (view: View) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setView }) => {
  
  const navItems = [
    { view: 'home' as View, label: 'Home', icon: HomeIcon },
    { view: 'learn' as View, label: 'Learn', icon: CompassIcon },
    { view: 'practice' as View, label: 'Practice', icon: TargetIcon },
    { view: 'wallet' as View, label: 'Wallet', icon: ScholarCoinIcon },
    { view: 'more' as View, label: 'More', icon: GridIcon },
  ];

  const NavButton: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = activeView === item.view || (activeView === 'lesson' && item.view === 'learn');
    return (
      <button
        onClick={() => setView(item.view)}
        className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 text-xs transition-colors relative ${
            isActive ? 'text-[var(--brand-primary)]' : 'text-slate-500 hover:text-[var(--brand-primary)]'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon className={`w-6 h-6 mb-0.5 transition-transform duration-200 ${isActive ? 'animate-bounce-in' : ''}`} />
        <span className={`font-semibold ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
        {isActive && <div className="absolute top-0 h-1 w-8 rounded-full bg-[var(--brand-primary)]"></div>}
      </button>
    );
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[var(--border-color)] shadow-[0_-2px_5px_rgba(0,0,0,0.05)] flex items-center justify-around z-20 md:hidden">
      {navItems.map(item => (
        <NavButton key={item.view} item={item} />
      ))}
    </nav>
  );
};

export default BottomNavBar;