import React, { useState } from 'react';
import { useStudentData } from '../../contexts/StudentDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { StudyTask } from '../../types';
import { View } from '../../App';
import { LayersIcon, CalendarCheckIcon, SparklesIcon, BookIcon, FlameIcon, XIcon, CheckCircleIcon } from '../../constants/icons';
import FocusSessionModal from '../FocusSessionModal';

interface TodayFocusWidgetProps {
    widget: {}; // Config might be used in the future
    setView: (view: View) => void;
    onRemove: (id: string) => void;
}

const TaskIcon: React.FC<{type: StudyTask['type']}> = ({ type }) => {
    const icons = {
      review_weakness: SparklesIcon,
      srs_review: LayersIcon,
      assignment: CalendarCheckIcon,
      next_lesson: BookIcon,
      manual: BookIcon,
    };
    const Icon = icons[type] || BookIcon;
    return <Icon className="w-6 h-6"/>;
};

const TodayFocusWidget: React.FC<TodayFocusWidgetProps> = ({ widget, setView, onRemove }) => {
    const { todayTasks } = useStudentData();
    const { updateActiveUserProfile, handleUpdateSingleTask } = useAuth();
    
    const [focusedTask, setFocusedTask] = useState<StudyTask | null>(null);
    const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
    
    const handleTaskAction = (task: StudyTask) => {
        if (task.isCompleted) return;

        switch(task.type) {
            case 'srs_review':
                setView('studio');
                break;
            case 'review_weakness':
            case 'next_lesson':
                if (task.data?.chapterId) {
                    const [, grade, subject, ...chapterParts] = task.data.chapterId.split('-');
                    updateActiveUserProfile({ lastChapter: chapterParts.join('-'), lastSubject: subject, grade });
                    setView('lesson');
                }
                break;
            case 'assignment':
                // FIX: 'assignments' is not a valid View type. Changed to 'academics'.
                setView('academics');
                break;
            case 'manual':
                // Manual tasks don't have a default action, maybe open a detail view later
                break;
        }
    };
    
    const handleSessionComplete = (taskId: string) => {
        handleUpdateSingleTask(taskId, { isCompleted: true });
        setFocusedTask(null);
        setJustCompletedId(taskId);
        setTimeout(() => setJustCompletedId(null), 800);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <style>{`
                @keyframes flash-complete {
                    0% { background-color: #d1fae5; } 100% { background-color: #f0fdf4; }
                }
                .animate-flash-complete { animation: flash-complete 0.8s ease-out; }
            `}</style>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800">Today's Focus</h3>
                <button onClick={() => onRemove((widget as any).id)} className="p-1 text-slate-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayTasks.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-2"/>
                        <p className="font-semibold">All clear for today!</p>
                    </div>
                ) : (
                    todayTasks.map(task => {
                        const isJustCompleted = justCompletedId === task.id;
                        return (
                            <div key={task.id} className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${task.isCompleted ? 'bg-green-50 border-green-200' : `bg-slate-50 border-slate-200`} ${isJustCompleted ? 'animate-flash-complete' : ''}`}>
                                <div className="flex items-center gap-3 flex-grow cursor-pointer" onClick={() => handleTaskAction(task)}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {task.isCompleted ? <CheckCircleIcon className="w-6 h-6 text-green-500"/> : <TaskIcon type={task.type} />}
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{task.title}</p>
                                        <p className="text-xs text-slate-500">{task.subtitle}</p>
                                    </div>
                                </div>
                                {!task.isCompleted && (
                                     <button onClick={() => setFocusedTask(task)} className="btn text-xs bg-white border border-slate-300 flex items-center gap-1 flex-shrink-0">
                                        <FlameIcon className="w-4 h-4 text-orange-500"/> Focus
                                    </button>
                                )}
                            </div>
                        )
                    })
                )}
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

export default TodayFocusWidget;