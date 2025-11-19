import React from 'react';
import { View } from '../App';
import { HomeIcon, CompassIcon, LayersIcon, TargetIcon, BookOpenIcon } from '../constants/icons';

interface BottomNavBarProps {
  activeView: View;
  setView: (view: View) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setView }) => {
  
  const navItems = [
    { view: 'home' as View, label: 'Home', icon: HomeIcon },
    { view: 'academics' as View, label: 'Academics', icon: CompassIcon },
    { view: 'lms' as View, label: 'LMS', icon: BookOpenIcon },
    { view: 'assess' as View, label: 'Assess', icon: TargetIcon },
    { view: 'studio' as View, label: 'Studio', icon: LayersIcon },
  ];

  const NavButton: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = activeView === item.view || (activeView === 'lesson' && item.view === 'academics');
    return (
      <button
        onClick={() => setView(item.view)}
        className={`group flex-1 flex flex-col items-center justify-center pt-2 pb-1 text-xs transition-colors relative ${
            isActive ? 'text-[var(--brand-primary)]' : 'text-slate-500 hover:text-[var(--brand-primary)]'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className={`relative w-14 h-8 flex items-center justify-center rounded-full transition-colors ${isActive ? 'bg-indigo-50' : ''}`}>
          <item.icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        </div>
        <span className={`font-semibold ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
      </button>
    );
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-t border-[var(--border-color)] shadow-[0_-2px_5px_rgba(0,0,0,0.05)] flex items-center justify-around z-20 lg:hidden">
      {navItems.map(item => (
        <NavButton key={item.view} item={item} />
      ))}
    </nav>
  );
};

export default BottomNavBar;
