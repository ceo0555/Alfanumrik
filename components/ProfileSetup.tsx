import React, { useState, useEffect } from 'react';
import { curriculum } from '../constants/curriculum';
import { UserIcon, ArrowRightIcon } from '../constants/icons';
import { UserProfile } from '../types';

interface ProfileSetupProps {
  onProfileSave: (name: string, grade: string, id?: number) => void;
  userToEdit?: UserProfile | null;
  onCancel?: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileSave, userToEdit = null, onCancel }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('10');
  
  const isEditing = !!userToEdit;

  useEffect(() => {
    if (isEditing && userToEdit) {
      setName(userToEdit.name);
      setGrade(userToEdit.grade);
    }
  }, [userToEdit, isEditing]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onProfileSave(name.trim(), grade, userToEdit?.id);
    }
  };

  const title = isEditing ? "Edit Profile" : "Welcome to Alfanumrik!";
  const subtitle = isEditing ? "Update the details for this profile." : "Let's get you set up for learning.";
  const buttonText = isEditing ? "Save Changes" : "Save and Continue";

  return (
    <div className="flex flex-col justify-center items-center h-full text-center animate-fade-in">
        {!isEditing && (
            <div className="w-24 h-24 bg-[var(--brand-secondary)] rounded-full flex items-center justify-center mb-6 ring-4 ring-blue-100">
                <UserIcon className="w-12 h-12 text-[var(--brand-primary)]" />
            </div>
        )}
        
        <h1 className="text-3xl font-extrabold text-slate-800">{title}</h1>
        <p className="text-slate-500 mt-2 mb-8">{subtitle}</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
            <div className="text-left">
                <label htmlFor="student-name" className="block text-sm font-bold text-slate-700 mb-2">
                    Name
                </label>
                <input
                    type="text"
                    id="student-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    required
                    className="form-input w-full px-4 py-3 text-base"
                />
            </div>
            <div className="text-left">
                <label htmlFor="grade-select" className="block text-sm font-bold text-slate-700 mb-2">
                    Class
                </label>
                <select
                    id="grade-select"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="form-select w-full px-4 py-3 text-base"
                >
                    {Object.keys(curriculum).map(g => (
                        <option key={g} value={g}>Class {g}</option>
                    ))}
                </select>
            </div>

            <div className="flex gap-4">
                 {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
                    >
                        Cancel
                    </button>
                 )}
                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                    {buttonText}
                    {!isEditing && <ArrowRightIcon className="w-5 h-5" />}
                </button>
            </div>
        </form>
    </div>
  );
};

export default ProfileSetup;