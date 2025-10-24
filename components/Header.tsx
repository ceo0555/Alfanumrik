import React from 'react';
import { ArrowLeftIcon, LogOutIcon } from '../constants/icons';
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
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors md:hidden">
              <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
            </button>
          )}
          <h1 className="text-lg font-bold text-slate-800 truncate">{title}</h1>
        </div>
        <div className="flex items-center">
            {activeProfile && (
              <>
                {userRole === 'student' ? (
                  <button 
                      onClick={onOpenUserModal}
                      className="h-9 w-9 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-lg ring-2 ring-offset-1 ring-indigo-200 hover:bg-[var(--brand-primary-hover)] transition-all transform hover:scale-105"
                      aria-label="Switch user profile"
                  >
                      {activeProfile.name.charAt(0).toUpperCase()}
                  </button>
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