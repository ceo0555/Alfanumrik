import React, { useState, Suspense } from 'react';
import { View } from '../App';
import { BookIcon, ClipboardListIcon, CompassIcon } from '../constants/icons';
import { SyllabusChapterTopic, Assignment } from '../types';

const CurriculumBrowser = React.lazy(() => import('./CurriculumBrowser'));
const LmsDashboard = React.lazy(() => import('./lms/LmsDashboard'));
const StudentAssignments = React.lazy(() => import('./StudentAssignments'));

interface AcademicsViewProps {
  onSelectTopic: (chapter: SyllabusChapterTopic, topic: string) => void;
  onOpenFlashcardCreator: (grade: string, subject: string, chapter: string) => void;
  setView: (view: View) => void;
  onStartQuiz: (assignment: Assignment) => void;
}

type AcademicsTab = 'syllabus' | 'courses' | 'homework';

const AcademicsView: React.FC<AcademicsViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AcademicsTab>('syllabus');

    const TabButton = ({ tabName, label, icon }: { tabName: AcademicsTab, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors text-sm ${
                activeTab === tabName
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'syllabus':
                return <CurriculumBrowser onSelectTopic={props.onSelectTopic} onOpenFlashcardCreator={props.onOpenFlashcardCreator} />;
            case 'courses':
                return <LmsDashboard setView={props.setView} setActiveQuiz={props.onStartQuiz} />;
            case 'homework':
                return <StudentAssignments setView={props.setView} onStartQuiz={props.onStartQuiz} />;
            default:
                return null;
        }
    };

    return (
        <div className="animate-slide-in-up">
            <div className="mb-6 border-b border-slate-200">
                <div className="flex items-center -mb-px flex-wrap">
                    <TabButton tabName="syllabus" label="Syllabus" icon={<CompassIcon className="w-5 h-5" />} />
                    <TabButton tabName="courses" label="Courses" icon={<BookIcon className="w-5 h-5" />} />
                    <TabButton tabName="homework" label="Homework" icon={<ClipboardListIcon className="w-5 h-5" />} />
                </div>
            </div>

            <div className="min-h-[400px]">
                <Suspense fallback={<div>Loading...</div>}>
                    {renderActiveTab()}
                </Suspense>
            </div>
        </div>
    );
};

export default AcademicsView;
