import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PracticeBlueprint } from '../types';
import { curriculum } from '../constants/curriculum';
import { practiceBlueprints } from '../constants/practiceBlueprints';
import { BookIcon, TargetIcon, ArrowRightIcon, CalendarDaysIcon, LayersIcon } from '../constants/icons';
import { pastPapers } from '../constants/pastPapers';
import { unitMappings } from '../constants/unitMappings';

interface PracticeSetupProps {
    onStartExam: (config: { subject: string, blueprint: PracticeBlueprint, mode: 'blueprint' | 'past_paper' | 'unit_test', chapters?: string[], year?: string }) => void;
    error: string | null;
}

const PracticeSetup: React.FC<PracticeSetupProps> = ({ onStartExam, error }) => {
    const { activeProfile } = useAuth();
    
    const subjects = useMemo(() => {
        if (!activeProfile) return [];
        return Object.keys(curriculum[activeProfile.grade as keyof typeof curriculum] || {});
    }, [activeProfile]);

    const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
    const [selectedMode, setSelectedMode] = useState<'blueprint' | 'past_paper' | 'unit_test'>('blueprint');

    if (!activeProfile) {
        return <p>Please select a profile to start practicing.</p>;
    }
    
    const handleStartPastPaper = (year: string) => {
        const paperData = pastPapers[year]?.[selectedSubject];
        if (!paperData) {
            alert('Could not find paper data.');
            return;
        }

        const pastPaperBlueprint: PracticeBlueprint = {
            id: `past-paper-${year}-${selectedSubject}`,
            title: `CBSE ${year} Board Paper (${selectedSubject})`,
            description: `Actual board paper questions from ${year}.`,
            durationMinutes: 180,
            totalMarks: paperData.reduce((sum, q) => sum + q.marks, 0),
            structure: [] // Structure is implicitly defined by the real paper's questions
        };
        onStartExam({ subject: selectedSubject, blueprint: pastPaperBlueprint, mode: 'past_paper', year });
    };

    const handleStartUnitTest = (unitName: string, chapters: string[]) => {
        const unitTestBlueprint: PracticeBlueprint = {
            id: `unit-test-${unitName.replace(/\s/g, '-')}`,
            title: `Unit Test: ${unitName}`,
            description: `A focused test on the chapters in the '${unitName}' unit for ${selectedSubject}.`,
            durationMinutes: chapters.length * 15, // 15 mins per chapter
            totalMarks: chapters.length * 10, // 10 marks per chapter
            structure: [
                { section: 'Section A', questionType: 'MCQ', count: chapters.length * 2, marksPerQuestion: 1 },
                { section: 'Section B', questionType: 'SA', count: chapters.length, marksPerQuestion: 3 },
            ]
        };
        onStartExam({ subject: selectedSubject, blueprint: unitTestBlueprint, mode: 'unit_test', chapters });
    };
    
    const handleStartBlueprint = (blueprint: PracticeBlueprint) => {
        onStartExam({ subject: selectedSubject, blueprint, mode: 'blueprint' });
    };

    const availablePastPapers = useMemo(() => {
        return Object.keys(pastPapers).filter(year => pastPapers[year][selectedSubject]);
    }, [selectedSubject]);
    
    const unitsForSubject = useMemo(() => {
        if (!activeProfile) return {};
        return unitMappings[activeProfile.grade as keyof typeof unitMappings]?.[selectedSubject] || {};
    }, [activeProfile, selectedSubject]);

    return (
        <div className="max-w-4xl mx-auto animate-slide-in-up">
            <div className="text-center mb-8">
                <TargetIcon className="w-16 h-16 mx-auto text-indigo-600 bg-indigo-100 p-3 rounded-full" />
                <h1 className="text-4xl font-extrabold text-slate-800 mt-4">Practice Centre</h1>
                <p className="text-slate-500 mt-2 text-lg">Hone your skills with mock exams, unit tests, and authentic past year board papers.</p>
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
                    <div className="p-1 bg-slate-100 rounded-lg flex gap-1 mb-4">
                        <button onClick={() => setSelectedMode('blueprint')} className={`flex-1 py-2 font-semibold text-sm rounded-md ${selectedMode === 'blueprint' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>Mock Exams</button>
                        <button onClick={() => setSelectedMode('unit_test')} className={`flex-1 py-2 font-semibold text-sm rounded-md ${selectedMode === 'unit_test' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>Unit Tests</button>
                        <button onClick={() => setSelectedMode('past_paper')} className={`flex-1 py-2 font-semibold text-sm rounded-md ${selectedMode === 'past_paper' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>Past Papers</button>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {selectedMode === 'blueprint' && practiceBlueprints.map(bp => (
                             <button key={bp.id} onClick={() => handleStartBlueprint(bp)} className="w-full text-left p-3 rounded-lg border-2 border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                                <p className="font-semibold">{bp.title}</p>
                                <p className="text-xs text-slate-500">{bp.description}</p>
                                <p className="text-xs font-bold text-slate-600 mt-1">{bp.durationMinutes} mins &middot; {bp.totalMarks} Marks</p>
                            </button>
                        ))}

                        {selectedMode === 'unit_test' && Object.entries(unitsForSubject).map(([unitName, chapters]) => (
                            <button key={unitName} onClick={() => handleStartUnitTest(unitName, chapters as string[])} className="w-full text-left p-3 rounded-lg border-2 border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all flex justify-between items-center">
                                <div>
                                    <p className="font-semibold flex items-center gap-2"><LayersIcon className="w-5 h-5 text-indigo-600"/>{unitName}</p>
                                    <p className="text-xs text-slate-500 pl-7">{(chapters as string[]).length} Chapters</p>
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-slate-400" />
                            </button>
                        ))}

                        {selectedMode === 'past_paper' && availablePastPapers.map(year => (
                            <button key={year} onClick={() => handleStartPastPaper(year)} className="w-full text-left p-3 rounded-lg border-2 border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CalendarDaysIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                    <span className="font-semibold">CBSE Board Paper {year}</span>
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-slate-400" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticeSetup;