import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { XIcon, SpeakerIcon } from '../constants/icons';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: string;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ isOpen, onClose, grade }) => {
  const { handleCreateAnnouncement } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    handleCreateAnnouncement({ title, content, grade });
    handleClose();
  };
  
  const handleClose = () => {
    setTitle('');
    setContent('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <SpeakerIcon className="w-6 h-6" /> Create Announcement for Class {grade}
          </h3>
          <button onClick={handleClose} className="p-1"><XIcon className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
            <div>
                <label htmlFor="announcement-title" className="form-label">Title</label>
                <input id="announcement-title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-input w-full" placeholder="e.g., Upcoming Test on Chapter 5" />
            </div>
            <div>
                <label htmlFor="announcement-content" className="form-label">Content</label>
                <textarea id="announcement-content" value={content} onChange={e => setContent(e.target.value)} rows={5} className="form-textarea w-full" placeholder="Enter details about the announcement..." />
            </div>
        </div>
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="mt-4 flex gap-4">
          <button onClick={handleClose} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary w-full">Post Announcement</button>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;