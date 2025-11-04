import React, { useState } from 'react';
import { UserProfile } from '../types';
import { UserIcon, PlusIcon, EditIcon, XIcon, CheckCircleIcon, LogOutIcon } from '../constants/icons';
import ProfileSetup from './ProfileSetup';
import { useAuth } from '../contexts/AuthContext';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchUser: (id: number) => void;
  profilesToList?: UserProfile[]; // For RBAC
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onSwitchUser,
  profilesToList,
}) => {
  const { userProfiles, activeUserId, handleSaveUser } = useAuth();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  const profiles = profilesToList || userProfiles;
  
  const handleAddNew = () => {
    setUserToEdit(null);
    setView('form');
  };

  const handleEdit = (user: UserProfile) => {
    setUserToEdit(user);
    setView('form');
  };
  
  const handleSave = (user: { name: string; grade: string }, id?: number) => {
    handleSaveUser(user, id);
    setView('list');
    setUserToEdit(null);
    // If we're adding a new user, don't close the modal, let them switch.
    if (!id) return;
    onClose();
  };
  
  const handleCancel = () => {
    setView('list');
    setUserToEdit(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800">
                {view === 'list' ? 'Switch Profile' : userToEdit ? 'Edit Profile' : 'Add New Profile'}
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
                <XIcon className="w-5 h-5 text-slate-500" />
            </button>
        </header>

        <div className="p-6 overflow-y-auto">
            {view === 'list' ? (
                <div className="space-y-3">
                    {profiles.map(profile => (
                        <div key={profile.id} className="flex items-center gap-3">
                            <div className="flex-grow flex items-center gap-3 p-3 rounded-lg bg-white border border-[var(--border-color)]">
                                <div className={`w-10 h-10 rounded-full ${profile.id === activeUserId ? 'bg-[var(--brand-primary)] text-white' : 'bg-slate-200 text-slate-600'} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{profile.name}</p>
                                    <p className="text-sm text-slate-500">{profile.grade ? `Class ${profile.grade}` : (profile.schoolRole || 'Parent')}</p>
                                </div>
                                {profile.id === activeUserId && <CheckCircleIcon className="w-5 h-5 text-emerald-500 ml-auto" />}
                            </div>
                            
                            {profile.id === activeUserId ? (
                                <button onClick={() => handleEdit(profile)} className="p-3 rounded-lg bg-white border border-[var(--border-color)] hover:bg-slate-100 text-slate-500" aria-label={`Edit ${profile.name}`}>
                                    <EditIcon className="w-5 h-5" />
                                </button>
                            ) : (
                                <button onClick={() => onSwitchUser(profile.id)} className="p-3 rounded-lg bg-white border border-[var(--border-color)] hover:bg-slate-100 text-slate-500" aria-label={`Switch to ${profile.name}`}>
                                    <LogOutIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button 
                        onClick={handleAddNew}
                        className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-3 bg-[var(--brand-secondary)] text-[var(--brand-primary-hover)] font-semibold rounded-lg hover:bg-blue-200 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add New User
                    </button>
                </div>
            ) : (
                <ProfileSetup 
                    onProfileSave={handleSave} 
                    userToEdit={userToEdit} 
                    onCancel={handleCancel} 
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;