import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PracticeBlueprint } from '../types';
import { curriculum } from '../constants/curriculum';
import { ArrowRightIcon, ArrowLeftIcon } from '../constants/icons';

interface OnDemandPracticeSetupProps {
    onStartExam: (subject: string, blueprint: PracticeBlueprint, chapters: string[]) => void;
    onBack?: () => void;
}

const OnDemandPracticeSetup: React.FC<OnDemandPracticeSetupProps> = ({ onStartExam, onBack }) => {
    const { activeProfile } = useAuth();
    const subjects = useMemo(() => {
        if (!activeProfile) return [];
        return Object.keys(curriculum[activeProfile.grade as keyof typeof curriculum] || {});
    }, [activeProfile]);

    const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
    const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());

    const chaptersForSubject = useMemo(() => {
        if (!activeProfile || !selectedSubject) return [];
        return curriculum[activeProfile.grade as keyof typeof curriculum][selectedSubject];
    }, [activeProfile, selectedSubject]);

    const handleToggleChapter = (chapter: string) => {
        setSelectedChapters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(chapter)) {
                newSet.delete(chapter);
            } else {
                newSet.add(chapter);
            }
            return newSet;
        });
    };

    const handleStart = () => {
        // Create a dynamic blueprint for the on-demand exam
        const onDemandBlueprint: PracticeBlueprint = {
            id: 'on-demand-exam',
            title: 'On-Demand Practice',
            description: `Custom exam for ${selectedSubject}`,
            durationMinutes: selectedChapters.size * 10, // 10 mins per chapter
            totalMarks: selectedChapters.size * 5, // 5 marks per chapter
            structure: [
                { section: 'Custom Section', questionType: 'MCQ', count: selectedChapters.size * 2, marksPerQuestion: 1 },
                { section: 'Custom Section', questionType: 'SA', count: selectedChapters.size, marksPerQuestion: 3 },
            ]
        };
        onStartExam(selectedSubject, onDemandBlueprint, Array.from(selectedChapters));
    };

    if (!activeProfile) return null;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border">
            <div className="flex items-center gap-4 mb-4">
                {onBack && (
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100" aria-label="Go back">
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                    </button>
                )}
                <h2 className="font-bold text-xl">On-Demand Practice Setup</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4 md:ml-14 -mt-4">You've unlocked an On-Demand Practice Paper! Select a subject and the chapters you want to focus on.</p>


            <div className="space-y-4">
                <div>
                    <label className="form-label">Subject</label>
                    <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedChapters(new Set()); }} className="form-select w-full">
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="form-label">Chapters ({selectedChapters.size} selected)</label>
                    <div className="max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-lg border space-y-2">
                        {chaptersForSubject.map(chapter => (
                            <label key={chapter} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                <input type="checkbox" checked={selectedChapters.has(chapter)} onChange={() => handleToggleChapter(chapter)} className="h-4 w-4 rounded" />
                                <span className="text-sm">{chapter}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
             <button
                onClick={handleStart}
                disabled={selectedChapters.size === 0}
                className="btn btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
                Generate & Start Exam ({selectedChapters.size * 2 + selectedChapters.size} Qs)
                <ArrowRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default OnDemandPracticeSetup;