import React, { useState, useMemo, Suspense } from 'react';
import { LayersIcon, RefreshCwIcon, CalendarDaysIcon, BarChartIcon, SparklesIcon } from './constants/icons';
import FlashcardViewer from './FlashcardViewer';
import ReviewQueue from './ReviewQueue';
import { useStudentData } from '../contexts/StudentDataContext';
import { FlashcardReviewItem, UserFlashcardItem, PracticeBlueprint } from '../types';
import { View } from '../App';
import Loader from './Loader';

// Lazy load heavy components
const Planner = React.lazy(() => import('../Planner'));
const ProgressDashboard = React.lazy(() => import('./ProgressDashboard'));
const ConceptExplainer = React.lazy(() => import('./ConceptExplainer'));

interface StudioViewProps {
    setView: (view: View) => void;
    onStartPractice: (subject: string, blueprint: PracticeBlueprint) => void;
}

const FlashcardManager: React.FC = () => {
    const [activeFlashcardTab, setActiveFlashcardTab] = useState<'review' | 'browse'>('review');
    const { userFlashcards, handleSrsSessionCompleted } = useStudentData();

     const reviewItems = useMemo(() => {
        if (!userFlashcards) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const items: FlashcardReviewItem[] = [];
        Object.entries(userFlashcards).forEach(([chapterId, deck]) => {
            (deck as UserFlashcardItem[]).forEach((item, cardIndex) => {
                if (!item.srsData || !item.srsData.due) return;
                const dueDate = new Date(item.srsData.due);
                if (dueDate <= today) {
                    const taskId = `srs-review-${chapterId}`;
                    items.push({ ...item, chapterId, cardIndex, id: taskId });
                }
            });
        });
        return items.sort((a, b) => new Date(a.srsData.due).getTime() - new Date(b.srsData.due).getTime());
    }, [userFlashcards]);
    
    const TabButton = ({ tabName, label, icon, count }: { tabName: 'review' | 'browse', label: string, icon: React.ReactNode, count?: number }) => (
        <button
            onClick={() => setActiveFlashcardTab(tabName)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 font-semibold border-b-2 transition-colors text-sm ${
                activeFlashcardTab === tabName
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
        >
            {icon}
            <span>{label}</span>
            {count !== undefined && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeFlashcardTab === tabName ? 'bg-indigo-100' : 'bg-slate-200'}`}>{count}</span>}
        </button>
    );

    return (
        <div>
            <div className="mb-6 border-b border-slate-200">
                <div className="flex items-center -mb-px">
                    <TabButton tabName="review" label="Review Queue" icon={<RefreshCwIcon className="w-5 h-5" />} count={reviewItems.length} />
                    <TabButton tabName="browse" label="My Flashcards" icon={<LayersIcon className="w-5 h-5" />} />
                </div>
            </div>
            <div className="min-h-[400px]">
                {activeFlashcardTab === 'review' 
                    ? <ReviewQueue reviewItems={reviewItems} onSessionComplete={handleSrsSessionCompleted} />
                    : <FlashcardViewer />
                }
            </div>
        </div>
    );
};


const StudioView: React.FC<StudioViewProps> = ({ setView, onStartPractice }) => {
    const [activeTab, setActiveTab] = useState<'planner' | 'progress' | 'flashcards' | 'tools'>('planner');

    const TabButton = ({ tabName, label, icon }: { tabName: typeof activeTab, label: string, icon: React.ReactNode }) => (
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
            case 'planner':
                return <Planner setView={setView} onStartPractice={onStartPractice} />;
            case 'progress':
                return <ProgressDashboard setView={setView} />;
            case 'flashcards':
                return <FlashcardManager />;
            case 'tools':
                return <ConceptExplainer />;
            default:
                return null;
        }
    };

    return (
        <div className="mx-auto animate-slide-in-up">
            <div className="mb-6 border-b border-slate-200">
                <div className="flex items-center -mb-px flex-wrap">
                    <TabButton tabName="planner" label="Planner" icon={<CalendarDaysIcon className="w-5 h-5" />} />
                    <TabButton tabName="progress" label="Progress" icon={<BarChartIcon className="w-5 h-5" />} />
                    <TabButton tabName="flashcards" label="Flashcards" icon={<LayersIcon className="w-5 h-5" />} />
                    <TabButton tabName="tools" label="AI Tools" icon={<SparklesIcon className="w-5 h-5" />} />
                </div>
            </div>

            <div className="min-h-[400px]">
                <Suspense fallback={<div className="flex items-center justify-center pt-10"><Loader /></div>}>
                    {renderActiveTab()}
                </Suspense>
            </div>
        </div>
    );
};

export default StudioView;
