import React, { useState, useMemo } from 'react';
import { LayersIcon, RefreshCwIcon } from '../constants/icons';
import FlashcardViewer from './FlashcardViewer';
import ReviewQueue from './ReviewQueue';
import { useStudentData } from '../contexts/StudentDataContext';
import { FlashcardReviewItem, UserFlashcardItem } from '../types';

const StudyStudio: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'review' | 'browse'>('review');
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
                    // The task ID is derived from the skill ID (chapterId)
                    const taskId = `srs-review-${chapterId}`;
                    items.push({
                        ...item,
                        chapterId,
                        cardIndex,
                        id: taskId,
                    });
                }
            });
        });
        return items.sort((a, b) => new Date(a.srsData.due).getTime() - new Date(b.srsData.due).getTime());
    }, [userFlashcards]);

    const TabButton = ({ tabName, label, icon, count }: { tabName: 'review' | 'browse', label: string, icon: React.ReactNode, count?: number }) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 font-semibold border-b-2 transition-colors text-sm ${
                    isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
            >
                {icon}
                <span>{label}</span>
                {count !== undefined && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-100' : 'bg-slate-200'}`}>{count}</span>}
            </button>
        );
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'review':
                return <ReviewQueue reviewItems={reviewItems} onSessionComplete={handleSrsSessionCompleted} />;
            case 'browse':
                return <FlashcardViewer />;
            default:
                return null;
        }
    };

    return (
        <div className="mx-auto animate-slide-in-up">
            <div className="mb-6 border-b border-slate-200">
                <div className="flex items-center -mb-px">
                    <TabButton tabName="review" label="Review Queue" icon={<RefreshCwIcon className="w-5 h-5" />} count={reviewItems.length} />
                    <TabButton tabName="browse" label="My Flashcards" icon={<LayersIcon className="w-5 h-5" />} />
                </div>
            </div>

            <div className="min-h-[400px]">
                {renderActiveTab()}
            </div>
        </div>
    );
};

export default StudyStudio;