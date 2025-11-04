import React, { useState } from 'react';
import { XIcon } from '../../constants/icons';

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (title: string, description: string) => void;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title.trim()) {
            alert("Please enter a course title.");
            return;
        }
        onCreate(title, description);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Create New Course</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="form-label">Course Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-input w-full" placeholder="e.g., Class 10 Biology" />
                    </div>
                    <div>
                        <label className="form-label">Description (Optional)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="form-textarea w-full" placeholder="A brief description of the course." />
                    </div>
                </div>
                <div className="mt-6 flex gap-4">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary w-full">Create Course</button>
                </div>
            </div>
        </div>
    );
};

export default CreateCourseModal;
