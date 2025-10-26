import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentData } from '../contexts/StudentDataContext';
import { curriculum } from '../constants/curriculum';
import { XIcon } from '../constants/icons';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, initialDate }) => {
  const { activeProfile } = useAuth();
  const { handleSetDueDate } = useStudentData();

  const [dueDate, setDueDate] = useState(initialDate.toISOString().split('T')[0]);
  
  const subjects = useMemo(() => {
    if (!activeProfile) return [];
    return Object.keys(curriculum[activeProfile.grade as keyof typeof curriculum] || {});
  }, [activeProfile]);
  
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  
  const chapters = useMemo(() => {
    if (!activeProfile || !selectedSubject) return [];
    return curriculum[activeProfile.grade as keyof typeof curriculum][selectedSubject] || [];
  }, [activeProfile, selectedSubject]);

  const [selectedChapter, setSelectedChapter] = useState(chapters[0] || '');

  useEffect(() => {
    setSelectedChapter(chapters[0] || '');
  }, [chapters]);

  if (!isOpen || !activeProfile) return null;

  const handleSave = () => {
    if (!selectedChapter || !dueDate) {
      alert("Please select a chapter and a due date.");
      return;
    }
    const chapterId = `G${activeProfile.grade}-${selectedSubject}-${selectedChapter}`;
    handleSetDueDate(chapterId, dueDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Add a Study Task</h3>
          <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="due-date" className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input type="date" id="due-date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="form-input w-full" min={new Date().toISOString().split("T")[0]} />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <select id="subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="form-select w-full">
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="chapter" className="block text-sm font-medium text-slate-700 mb-1">Chapter to Study</label>
            <select id="chapter" value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className="form-select w-full" disabled={!selectedSubject}>
              {chapters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <button onClick={onClose} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary w-full">Add Task</button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
