import React, { useState } from 'react';
import { StudyTask } from '../types';
import { XIcon } from '../constants/icons';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
  onAddTask: (taskData: Omit<StudyTask, 'id' | 'type' | 'isCompleted'>) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, initialDate, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(initialDate.toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !dueDate) {
      alert("Please add a title and a due date.");
      return;
    }
    onAddTask({
      title,
      notes,
      subtitle: 'Manual Task',
      dueDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Add a Manual Task</h3>
          <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
            <input type="text" id="task-title" value={title} onChange={e => setTitle(e.target.value)} className="form-input w-full" placeholder="e.g., Read chapter 3" />
          </div>
          <div>
            <label htmlFor="task-notes" className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea id="task-notes" value={notes} onChange={e => setNotes(e.target.value)} className="form-textarea w-full" rows={2} placeholder="e.g., Focus on the diagrams" />
          </div>
          <div>
            <label htmlFor="due-date" className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input type="date" id="due-date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="form-input w-full" min={new Date().toISOString().split("T")[0]} />
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
