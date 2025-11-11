import React, { useState, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { View } from './App';
import { FlameIcon, PlusIcon, AwardIcon } from './constants/icons';
import { WidgetConfig, PracticeBlueprint } from './types';
import TodayFocusWidget from './components/widgets/TodayFocusWidget';
import PinnedChapterWidget from './components/widgets/PinnedChapterWidget';
import PinnedPracticeWidget from './components/widgets/PinnedPracticeWidget';
import QuickNoteWidget from './components/widgets/QuickNoteWidget';
import StudyPet from './components/StudyPet';

const AddWidgetModal = React.lazy(() => import('./components/AddWidgetModal'));

interface StudentDashboardProps {
    setView: (view: View) => void;
    onStartPractice: (subject: string, blueprint: PracticeBlueprint) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ setView, onStartPractice }) => {
    const { activeProfile, handleUpdateWidgets } = useAuth();
    const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);

    if (!activeProfile) return null;

    const handleRemoveWidget = (idToRemove: string) => {
        const updatedWidgets = (activeProfile.widgets || []).filter(w => w.id !== idToRemove);
        handleUpdateWidgets(updatedWidgets);
    };
    
    const handleUpdateWidgetData = (idToUpdate: string, data: any) => {
        const updatedWidgets = (activeProfile.widgets || []).map(w => {
            if (w.id === idToUpdate) {
                // Type guard to ensure 'data' property exists before spreading
                if ('data' in w && w.data) {
                    return { ...w, data: { ...w.data, ...data } };
                }
                return { ...w, data: data };
            }
            return w;
        });
        handleUpdateWidgets(updatedWidgets);
    };

    const renderWidget = (widget: WidgetConfig) => {
        switch (widget.type) {
            case 'today_focus':
                return <TodayFocusWidget key={widget.id} widget={widget} setView={setView} onRemove={handleRemoveWidget} />;
            case 'pinned_chapter':
                return <PinnedChapterWidget key={widget.id} widget={widget} setView={setView} onRemove={handleRemoveWidget} />;
            case 'pinned_practice':
                return <PinnedPracticeWidget key={widget.id} widget={widget} onStartPractice={onStartPractice} onRemove={handleRemoveWidget} />;
            case 'quick_note':
                return <QuickNoteWidget key={widget.id} widget={widget} onUpdate={handleUpdateWidgetData} onRemove={handleRemoveWidget} />;
            default:
                return null;
        }
    };
    
    const widgets = activeProfile.widgets || [];
    const todayFocusWidget = widgets.find(w => w.type === 'today_focus');
    const otherWidgets = widgets.filter(w => w.type !== 'today_focus');


    return (
        <div className="animate-slide-in-up">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Welcome back, {activeProfile.name}!</h1>
                    <p className="text-slate-500">Let's make today a productive day.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-2 bg-orange-100 rounded-full text-orange-700 font-bold">
                        <FlameIcon className="w-5 h-5" />
                        <span>{activeProfile.currentStreak} Day Streak</span>
                    </div>
                     <div className="flex items-center gap-2 p-2 bg-purple-100 rounded-full text-purple-700 font-bold">
                        <AwardIcon className="w-5 h-5" />
                        <span>Level {activeProfile.level}</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Render today's focus first and make it span more columns */}
                {todayFocusWidget && <div className="md:col-span-2 xl:col-span-2 row-span-2">{renderWidget(todayFocusWidget)}</div>}
                
                {/* Render other widgets */}
                {otherWidgets.map(renderWidget)}

                {/* Study Pet and Add Widget are special */}
                <StudyPet accessories={activeProfile.unlockedPetAccessories || []} />
                
                <button
                    onClick={() => setIsAddWidgetModalOpen(true)}
                    className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-slate-500 hover:text-indigo-600 min-h-[180px]"
                >
                    <PlusIcon className="w-8 h-8 mb-2" />
                    <span className="font-semibold">Add Widget</span>
                </button>
            </div>
            
            {isAddWidgetModalOpen && (
                <Suspense>
                    <AddWidgetModal isOpen={isAddWidgetModalOpen} onClose={() => setIsAddWidgetModalOpen(false)} />
                </Suspense>
            )}
        </div>
    );
};

export default StudentDashboard;