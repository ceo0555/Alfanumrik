import React from 'react';
import { PinnedChapterWidgetConfig } from '../../types';
import { View } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import { BookIcon, ArrowRightIcon, XIcon } from '../../constants/icons';

interface PinnedChapterWidgetProps {
    widget: PinnedChapterWidgetConfig;
    setView: (view: View) => void;
    onRemove: (id: string) => void;
}

const PinnedChapterWidget: React.FC<PinnedChapterWidgetProps> = ({ widget, setView, onRemove }) => {
    const { updateActiveUserProfile } = useAuth();
    const { grade, subject, chapter } = widget.data;
    
    const handleNavigate = () => {
        updateActiveUserProfile({ grade, lastSubject: subject, lastChapter: chapter });
        setView('lesson');
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-indigo-100 rounded-full">
                    <BookIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <button onClick={() => onRemove(widget.id)} className="p-1 text-slate-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500">{subject} - Class {grade}</p>
            <h4 className="font-bold text-slate-800 truncate">{chapter}</h4>
            <button onClick={handleNavigate} className="btn btn-primary text-sm w-full mt-3 flex items-center justify-center gap-1">
                Go to Lesson <ArrowRightIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default PinnedChapterWidget;