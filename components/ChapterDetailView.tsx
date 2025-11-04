import React from 'react';
import { XIcon, CheckCircleIcon, BookIcon } from '../constants/icons';
import { DktAttempt } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { View } from '../App';

interface ChapterDetailViewProps {
    isOpen: boolean;
    onClose: () => void;
    chapterId: string;
    chapterName: string;
    mastery: number;
    history: DktAttempt[];
    setView: (view: View) => void;
}

const ChapterDetailView: React.FC<ChapterDetailViewProps> = ({ isOpen, onClose, chapterId, chapterName, mastery, history, setView }) => {
    const { updateActiveUserProfile } = useAuth();
    
    if (!isOpen) return null;

    const percentage = Math.round(mastery * 100);
    const last20Attempts = history.slice(-20);
    
    const handleReview = () => {
        const [, grade, subject, ...chapterParts] = chapterId.split('-');
        updateActiveUserProfile({ grade, lastSubject: subject, lastChapter: chapterParts.join('-') });
        onClose();
        setView('lesson');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-bold text-lg text-slate-800">{chapterName}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </header>
                <div className="p-6">
                    <div className="text-center mb-6">
                        <p className="text-sm font-semibold text-slate-500">Current Mastery</p>
                        <p className="text-6xl font-extrabold text-indigo-600">{percentage}%</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-700 mb-2">Recent Attempts</h3>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const attempt = last20Attempts[i];
                                if (!attempt) {
                                    return <div key={i} className="w-6 h-6 bg-slate-200 rounded-sm" title="No attempt"></div>;
                                }
                                return (
                                    <div 
                                        key={i} 
                                        className={`w-6 h-6 rounded-sm flex items-center justify-center ${attempt.correct ? 'bg-emerald-500' : 'bg-red-500'}`}
                                        title={attempt.correct ? 'Correct' : 'Incorrect'}
                                    >
                                        {attempt.correct ? 
                                            <CheckCircleIcon className="w-4 h-4 text-white" /> : 
                                            <XIcon className="w-4 h-4 text-white" />
                                        }
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <footer className="p-4 bg-slate-50 border-t">
                    <button onClick={handleReview} className="btn btn-primary w-full flex items-center justify-center gap-2">
                        <BookIcon className="w-5 h-5" />
                        Review This Lesson
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ChapterDetailView;