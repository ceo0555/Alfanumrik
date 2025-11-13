import React, { useState, useEffect, Suspense } from 'react';
import { View } from '../App';
import { TargetIcon, ShieldCheckIcon, SparklesIcon } from '../constants/icons';
import { PracticeBlueprint } from '../types';

const PracticeCentre = React.lazy(() => import('./PracticeCentre'));
const ExamsView = React.lazy(() => import('./ExamsView'));
const AdaptivePractice = React.lazy(() => import('./AdaptivePractice'));

interface AssessViewProps {
    examToStart?: { subject: string; blueprint: PracticeBlueprint } | null;
    onExamFinish: () => void;
    mode: 'on-demand' | 'yolo' | null;
    setView: (view: View) => void;
}

type AssessTab = 'practice' | 'exams' | 'ai_practice';

const AssessView: React.FC<AssessViewProps> = ({ examToStart, onExamFinish, mode, setView }) => {
    const [activeTab, setActiveTab] = useState<AssessTab>('practice');

    useEffect(() => {
        if (mode) {
            setActiveTab('practice');
        }
    }, [mode]);

    const handleBack = () => {
        setView('studio');
    };

    const TabButton = ({ tabName, label, icon }: { tabName: AssessTab, label: string, icon: React.ReactNode }) => (
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
            case 'practice':
                return <PracticeCentre 
                    examToStart={examToStart}
                    onExamFinish={onExamFinish}
                    mode={mode}
                    onBack={handleBack}
                />;
            case 'exams':
                return <ExamsView />;
            case 'ai_practice':
                return <AdaptivePractice />;
            default:
                return null;
        }
    };

    return (
        <div className="animate-slide-in-up">
            <div className="mb-6 border-b border-slate-200">
                <div className="flex items-center -mb-px flex-wrap">
                    <TabButton tabName="practice" label="Practice Centre" icon={<TargetIcon className="w-5 h-5" />} />
                    <TabButton tabName="exams" label="Secure Exams" icon={<ShieldCheckIcon className="w-5 h-5" />} />
                    <TabButton tabName="ai_practice" label="AI Practice" icon={<SparklesIcon className="w-5 h-5" />} />
                </div>
            </div>

            <div className="min-h-[400px]">
                <Suspense fallback={<div>Loading assessment tool...</div>}>
                    {renderActiveTab()}
                </Suspense>
            </div>
        </div>
    );
};

export default AssessView;