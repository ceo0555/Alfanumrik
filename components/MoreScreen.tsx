import React from 'react';
import { View } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardListIcon, CalendarDaysIcon, MicrophoneIcon, WandIcon, UsersIcon, LogOutIcon, ArrowRightIcon } from '../constants/icons';

interface MoreScreenProps {
  setView: (view: View) => void;
  onOpenUserModal: () => void;
  onLogout: () => void;
}

const MoreScreen: React.FC<MoreScreenProps> = ({ setView, onOpenUserModal, onLogout }) => {
  const { activeProfile } = useAuth();

  const toolItems = [
    { view: 'assignments' as View, label: 'Homework', icon: ClipboardListIcon },
    { view: 'planner' as View, label: 'Planner', icon: CalendarDaysIcon },
    { view: 'tutor' as View, label: 'Live Tutor', icon: MicrophoneIcon },
    { view: 'tools' as View, label: 'AI Studio', icon: WandIcon },
  ];

  const ListItem: React.FC<{ item: typeof toolItems[0] }> = ({ item }) => (
    <button
      onClick={() => setView(item.view)}
      className="w-full flex items-center gap-4 p-4 text-left bg-white rounded-lg hover:bg-slate-50 transition-colors"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500">
        <item.icon className="w-6 h-6" />
      </div>
      <span className="flex-1 font-semibold text-slate-700">{item.label}</span>
      <ArrowRightIcon className="w-5 h-5 text-slate-400" />
    </button>
  );

  return (
    <div className="animate-slide-in-up">
      {/* Profile Section */}
      <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-3xl flex-shrink-0 ring-4 ring-indigo-100">
            {activeProfile?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-xl text-slate-800">{activeProfile?.name}</p>
            <p className="text-sm text-slate-500">Level {activeProfile?.level} &middot; Class {activeProfile?.grade}</p>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="space-y-3 mb-6">
        {toolItems.map(item => (
          <ListItem key={item.view} item={item} />
        ))}
      </div>
      
      {/* Account Actions */}
      <div className="space-y-3">
        <button
          onClick={onOpenUserModal}
          className="w-full flex items-center gap-4 p-4 text-left bg-white rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500">
            <UsersIcon className="w-6 h-6" />
          </div>
          <span className="flex-1 font-semibold text-slate-700">Switch Profile</span>
          <ArrowRightIcon className="w-5 h-5 text-slate-400" />
        </button>
         <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-4 text-left bg-white rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500">
            <LogOutIcon className="w-6 h-6" />
          </div>
          <span className="flex-1 font-semibold text-slate-700">Switch Role</span>
          <ArrowRightIcon className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </div>
  );
};

export default MoreScreen;