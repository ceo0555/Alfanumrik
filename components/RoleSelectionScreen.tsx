import React from 'react';
import { UserRole } from '../types';
import { UserIcon, UsersIcon, SchoolIcon, NetworkIcon } from '../constants/icons';

interface RoleSelectionScreenProps {
  onSelectRole: (role: UserRole) => void;
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectRole }) => {
  const RoleCard = ({ role, label, icon, gradient }: { role: UserRole, label: string, icon: React.ReactNode, gradient: string }) => (
    <button
      onClick={() => onSelectRole(role)}
      className={`group w-full p-6 md:p-8 flex flex-col items-center justify-center bg-white rounded-3xl shadow-lg border-2 border-transparent hover:border-[var(--brand-primary)] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
    >
      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${gradient}`}>
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-bold text-slate-800">I am a</h3>
      <p className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">{label}</p>
    </button>
  );

  return (
    <div className="flex flex-col justify-center items-center h-full text-center animate-slide-in-up p-4 sm:p-6">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--brand-primary)] rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-[-12deg]">
        <span className="text-white font-bold text-3xl md:text-4xl font-poppins">A</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">Welcome to Alfanumrik</h1>
      <p className="text-slate-500 mt-2 mb-8 md:mb-10 text-base sm:text-lg">Your personalized CBSE learning companion.</p>

      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
        <RoleCard
          role="student"
          label="Student"
          icon={<UserIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />}
          gradient="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <RoleCard
          role="parent"
          label="Parent"
          icon={<UsersIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <RoleCard
          role="school"
          label="School"
          icon={<SchoolIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />}
          gradient="bg-gradient-to-br from-indigo-400 to-indigo-600"
        />
      </div>
    </div>
  );
};

export default RoleSelectionScreen;