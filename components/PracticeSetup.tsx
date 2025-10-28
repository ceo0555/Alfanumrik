import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PracticeBlueprint } from '../types';
import { curriculum } from '../constants/curriculum';
import { practiceBlueprints } from '../constants/practiceBlueprints';
import { BookIcon, TargetIcon, ArrowRightIcon } from '../constants/icons';

interface PracticeSetupProps {
    onStartExam: (subject: string, blueprint: PracticeBlueprint) => void;
    error: string | null;
}

const PracticeSetup: React.FC<PracticeSetupProps> = ({ onStartExam, error }) => {
    const { activeProfile } = useAuth();
    
    const subjects = useMemo(() => {
        if (!activeProfile) return [];
        return Object.keys(curriculum[activeProfile.grade as keyof typeof curriculum] || {});
    }, [activeProfile]);

    const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
    const [selectedBlueprint, setSelectedBlueprint] = useState<PracticeBlueprint>(practiceBlueprints[0]);

    if (!activeProfile) {
        return <p>Please select a profile to start practicing.</p>;
    }
    
    return (
        <div className="max-w-4xl mx-auto animate-slide-in-up">
            <div className="text-center mb-8">
                <TargetIcon className="w-16 h-16 mx-auto text-indigo-600 bg-indigo-100 p-3 rounded-full" />
                <h1 className="text-4xl font-extrabold text-slate-800 mt-4">Practice Centre</h1>
                <p className="text-slate-500 mt-2 text-lg">Hone your skills with AI-generated practice exams.</p>
            </div>
            
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-center">
                    <p className="font-semibold">Oops! Something went wrong.</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-xl mb-4">1. Select Your Subject</h2>
                     <div className="space-y-3">
                        {subjects.map(subject => (
                            <button
                                key={subject}
                                onClick={() => setSelectedSubject(subject)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                                    selectedSubject === subject ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <BookIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                <span className="font-semibold">{subject}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-xl mb-4">2. Choose a Practice Type</h2>
                    <div className="space-y-3">
                         {practiceBlueprints.map(bp => (
                             <button
                                key={bp.id}
                                onClick={() => setSelectedBlueprint(bp)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                    selectedBlueprint.id === bp.id ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <p className="font-semibold">{bp.title}</p>
                                <p className="text-xs text-slate-500">{bp.description}</p>
                                <p className="text-xs font-bold text-slate-600 mt-1">{bp.durationMinutes} mins &middot; {bp.totalMarks} Marks</p>
                            </button>
                         ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={() => onStartExam(selectedSubject, selectedBlueprint)}
                    disabled={!selectedSubject}
                    className="btn btn-primary btn-lg text-lg px-12 py-4 flex items-center gap-3 mx-auto"
                >
                    Start Practice Exam
                    <ArrowRightIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default PracticeSetup;
