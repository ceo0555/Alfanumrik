import React from 'react';
import { ArrowLeftIcon, LogOutIcon, ScholarCoinIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface HeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  title: string | undefined;
  onOpenUserModal: () => void;
  userRole: UserRole | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBack, title, onOpenUserModal, userRole, onLogout }) => {
  const { activeProfile } = useAuth();

  return (
    <header className="flex-shrink-0 bg-[var(--bg-app)] md:bg-white border-b border-[var(--border-color)] z-10">
      <div className="flex items-center h-16 px-4 md:px-6 gap-2">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors md:hidden"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
          </button>
        )}

        <h1 className="flex-1 text-xl font-bold text-slate-800 truncate">
          {title}
        </h1>

        <div className="flex items-center">
            {activeProfile && (
              <>
                {userRole === 'student' ? (
                  <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2 p-2 bg-amber-100 rounded-full text-amber-800">
                        <ScholarCoinIcon className="w-5 h-5" />
                        <span className="font-bold text-sm">{activeProfile.scholarCoins}</span>
                    </div>
                    <button 
                        onClick={onOpenUserModal}
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg ring-2 ring-offset-2 ring-indigo-200 shadow-md transition-transform transform hover:scale-110"
                        aria-label={`Switch from ${activeProfile.name} profile`}
                    >
                        {activeProfile.name.charAt(0).toUpperCase()}
                    </button>
                  </div>
                ) : (
                  <button 
                      onClick={onLogout}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[var(--brand-primary)] transition-colors"
                      aria-label="Switch role"
                  >
                      <LogOutIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Switch Role</span>
                  </button>
                )}
              </>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;