import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentData } from '../contexts/StudentDataContext';
import { curriculum } from '../constants/curriculum';
import { INITIAL_MASTERY } from '../services/adaptiveEngine';
import MasteryCircle from './MasteryCircle';
import { View } from '../App';
import { DktSkillState } from '../types';

const ChapterDetailView = React.lazy(() => import('./ChapterDetailView'));

interface ProgressDashboardProps {
    setView: (view: View) => void;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ setView }) => {
    const { activeProfile } = useAuth();
    const { userDktData } = useStudentData();

    const [selectedSubject, setSelectedSubject] = useState(activeProfile?.lastSubject || '');
    const [selectedChapter, setSelectedChapter] = useState<{ id: string, name: string } | null>(null);
    
    const { grade } = activeProfile!;
    const subjects = useMemo(() => Object.keys(curriculum[grade as keyof typeof curriculum] || {}), [grade]);
    
    React.useEffect(() => {
        if (!selectedSubject && subjects.length > 0) {
            setSelectedSubject(subjects[0]);
        }
    }, [selectedSubject, subjects]);
    
    const chapters = useMemo(() => curriculum[grade as keyof typeof curriculum]?.[selectedSubject] || [], [grade, selectedSubject]);

    const overallMastery = useMemo(() => {
        if (!userDktData || Object.keys(userDktData).length === 0) return 0;
        const skills = Object.values(userDktData) as DktSkillState[];
        const totalMastery = skills.reduce((sum, skill) => sum + skill.mastery, 0);
        return Math.round((totalMastery / skills.length) * 100);
    }, [userDktData]);

    const handleChapterClick = (chapterId: string, chapterName: string) => {
        setSelectedChapter({ id: chapterId, name: chapterName });
    };

    return (
        <div className="animate-slide-in-up">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">My Progress</h1>
            <p className="text-slate-500 mb-6">A visual map of your mastery across all subjects.</p>

            <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-slate-800">Overall Mastery</h3>
                    <span className="font-bold text-indigo-600">{overallMastery}%</span>
                </div>
                 <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full" style={{ width: `${overallMastery}%` }}></div>
                </div>
            </div>

            <div className="border-b border-slate-200 mb-6">
                <div className="flex items-center -mb-px flex-nowrap overflow-x-auto">
                    {subjects.map(subject => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            className={`flex-shrink-0 px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                                selectedSubject === subject
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {subject}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {chapters.map(chapterName => {
                    const chapterId = `G${grade}-${selectedSubject}-${chapterName}`;
                    const mastery = userDktData[chapterId]?.mastery ?? INITIAL_MASTERY;
                    return (
                        <MasteryCircle
                            key={chapterId}
                            mastery={mastery}
                            label={chapterName}
                            onClick={() => handleChapterClick(chapterId, chapterName)}
                        />
                    );
                })}
            </div>

            {selectedChapter && (
                <Suspense>
                    <ChapterDetailView
                        isOpen={!!selectedChapter}
                        onClose={() => setSelectedChapter(null)}
                        chapterId={selectedChapter.id}
                        chapterName={selectedChapter.name}
                        mastery={userDktData[selectedChapter.id]?.mastery ?? INITIAL_MASTERY}
                        history={userDktData[selectedChapter.id]?.history ?? []}
                        setView={setView}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default ProgressDashboard;