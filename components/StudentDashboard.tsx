import React, { useState, useMemo } from 'react';
// FIX: Corrected import paths to be relative to the components/ directory
import { useAuth } from '../contexts/AuthContext';
import { StudyTask, PracticeBlueprint } from '../types';
import { View } from '../App';
import { FlameIcon, PlusIcon, AwardIcon, CalendarDaysIcon } from '../constants/icons';
import TaskCard from './TaskCard';
import FocusSessionModal from './FocusSessionModal';
import { useStudentData } from '../contexts/StudentDataContext';
// FIX: Add missing imports for dashboard widgets.
import TodayFocusWidget from './widgets/TodayFocusWidget';
import PinnedChapterWidget from './widgets/PinnedChapterWidget';
import PinnedPracticeWidget from './widgets/PinnedPracticeWidget';
import QuickNoteWidget from './widgets/QuickNoteWidget';
import StudyPet from './StudyPet';

interface StudentDashboardProps {
    setView: (view: View) => void;
    onStartPractice: (subject: string, blueprint: PracticeBlueprint) => void;
}


const StudentDashboard: React.FC<StudentDashboardProps> = ({ setView, onStartPractice }) => {
    const { activeProfile } = useAuth();
    const { todayTasks } = useStudentData();
    const [focusedTask, setFocusedTask] = useState<StudyTask | null>(null);
    const [completedSessionTasks, setCompletedSessionTasks] = useState<Set<string>>(new Set());

    const tasksToDisplay = useMemo(() => {
        return todayTasks.filter(task => !completedSessionTasks.has(task.id));
    }, [todayTasks, completedSessionTasks]);

    const upNextTask = useMemo(() => {
        return tasksToDisplay.find(task => !task.isCompleted);
    }, [tasksToDisplay]);
    
    const handleSessionComplete = (taskId: string) => {
        setCompletedSessionTasks(prev => new Set(prev).add(taskId));
        setFocusedTask(null);
    };

    if (!activeProfile) return null;

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
                {todayTasks.length > 0 && (
                     <div className="md:col-span-2 xl:col-span-2 row-span-2">
                        <TodayFocusWidget 
                            widget={{ id: 'today-focus', type: 'today_focus' }} 
                            setView={setView} 
                            onRemove={() => {}} // This widget cannot be removed from this view.
                        />
                     </div>
                )}
                
                {/* Other standard widgets */}
                {activeProfile.widgets?.filter(w => w.type !== 'today_focus').map(widget => {
                     switch (widget.type) {
                        case 'pinned_chapter':
                            return <PinnedChapterWidget key={widget.id} widget={widget} setView={setView} onRemove={()=>{}} />;
                        case 'pinned_practice':
                            return <PinnedPracticeWidget key={widget.id} widget={widget} onStartPractice={onStartPractice} onRemove={()=>{}} />;
                        case 'quick_note':
                            return <QuickNoteWidget key={widget.id} widget={widget} onUpdate={()=>{}} onRemove={()=>{}} />;
                        default:
                            return null;
                    }
                })}

                <StudyPet accessories={activeProfile.unlockedPetAccessories || []} />
            </div>

            {focusedTask && (
                <FocusSessionModal
                    isOpen={!!focusedTask}
                    onClose={() => setFocusedTask(null)}
                    task={focusedTask}
                    onSessionComplete={handleSessionComplete}
                />
            )}
        </div>
    );
};

export default StudentDashboard;