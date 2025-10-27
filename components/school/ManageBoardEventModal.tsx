import React, { useState } from 'react';
import { XIcon } from '../../constants/icons';
import { useAuth } from '../../contexts/AuthContext';
import { BoardPlannerEvent, BoardPlannerEventIcon } from '../../types';

interface ManageBoardEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ManageBoardEventModal: React.FC<ManageBoardEventModalProps> = ({ isOpen, onClose }) => {
    const { boardPlannerEvents, handleUpdateBoardPlannerEvents } = useAuth();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [icon, setIcon] = useState<BoardPlannerEventIcon>('CalendarDaysIcon');

    if (!isOpen) return null;

    const handleSave = () => {
        const newEvent: BoardPlannerEvent = {
            id: `custom-${Date.now()}`,
            title,
            description,
            date,
            icon,
            color: 'blue', // Default color for custom events
        };
        handleUpdateBoardPlannerEvents([...boardPlannerEvents, newEvent]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Add Custom Event</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="space-y-3">
                    <input type="text" placeholder="Event Title" value={title} onChange={e => setTitle(e.target.value)} className="form-input w-full" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input w-full" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="form-textarea w-full" rows={3}></textarea>
                    <select value={icon} onChange={e => setIcon(e.target.value as BoardPlannerEventIcon)} className="form-select w-full">
                        <option value="CalendarDaysIcon">General</option>
                        <option value="ClipboardCheckIcon">Assessment</option>
                        <option value="RefreshCwIcon">Cycle</option>
                        <option value="AwardIcon">Celebration</option>
                    </select>
                </div>
                <div className="mt-4 flex gap-4">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary w-full">Save Event</button>
                </div>
            </div>
        </div>
    );
};

export default ManageBoardEventModal;