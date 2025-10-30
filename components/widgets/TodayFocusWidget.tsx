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

const TodayFocusWidget: React.FC<TodayFocusWidgetProps> = ({ widget, setView, onRemove }) => {
    const { todayTasks } = useStudentData();
    const { updateActiveUserProfile } = useAuth();
    
    const [focusedTask, setFocusedTask] = useState<StudyTask | null>(null);
    const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
    const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
    
    const handleTaskAction = (task: StudyTask) => {
        if (task.type === 'srs_review') setView('planner');
        else if (task.data?.chapterId) {
            const [, grade, subject, ...chapterParts] = task.data.chapterId.split('-');
            updateActiveUserProfile({ lastChapter: chapterParts.join('-'), lastSubject: subject, grade });
            setView('lesson');
        } else if (task.data?.assignmentId) setView('assignments');
    };
    
    const handleSessionComplete = (taskId: string) => {
        setCompletedToday(prev => new Set(prev).add(taskId));
        setFocusedTask(null);
        setJustCompletedId(taskId);
        setTimeout(() => setJustCompletedId(null), 800);
    };

    const subjectColors: { [key: string]: { bg: string, text: string, border: string } } = {
        'Science': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        'Maths': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        'Social Studies': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
        'Default': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
    };

    const topTask = todayTasks.find(t => !completedToday.has(t.id));

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <style>{`
                @keyframes flash-complete {
                    0% { background-color: #a7f3d0; transform: scale(1.02); }
                    100% { background-color: #ecfdf5; transform: scale(1); }
                }
                .animate-flash-complete {
                    animation: flash-complete 0.8s ease-out;
                }
            `}</style>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800">Today's Focus</h3>
                <button onClick={() => onRemove((widget as any).id)} className="p-1 text-slate-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
            </div>

            {topTask && (
                 <button onClick={() => setFocusedTask(topTask)} className="w-full btn btn-primary mb-4 flex items-center justify-center gap-2">
                    <FlameIcon className="w-5 h-5"/> Start Next Focus Session
                </button>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayTasks.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">All clear for today!</p>
                ) : (
                    todayTasks.map(task => {
                        const subject = task.subtitle.split(' in ')[1] || 'General';
                        const color = subjectColors[subject] || subjectColors['Default'];
                        const Icon = task.type === 'srs_review' ? LayersIcon : task.type === 'assignment' ? CalendarCheckIcon : task.type === 'review_weakness' ? SparklesIcon : BookIcon;
                        const isSessionCompleted = completedToday.has(task.id);
                        const isJustCompleted = justCompletedId === task.id;

                        return (
                            <div key={task.id} className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${isSessionCompleted ? 'bg-green-50 border-green-200' : `${color.bg} ${color.border}`} ${isJustCompleted ? 'animate-flash-complete' : ''}`}>
                                <div className="flex items-start gap-3 flex-grow">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSessionCompleted ? 'bg-green-100 text-green-600' : `${color.bg} ${color.text} border ${color.border}`}`}>
                                        {isSessionCompleted ? <CheckCircleIcon className="w-6 h-6"/> : <Icon className="w-6 h-6"/>}
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isSessionCompleted ? 'text-green-800 line-through' : color.text}`}>{task.title}</p>
                                        <p className="text-xs text-slate-500">{task.subtitle}</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    <button onClick={() => handleTaskAction(task)} className="btn text-xs bg-white border border-slate-300">View</button>
                                    <button onClick={() => setFocusedTask(task)} disabled={isSessionCompleted} className="btn text-xs bg-white border border-slate-300 flex items-center gap-1 disabled:opacity-50">
                                        <FlameIcon className="w-4 h-4 text-orange-500"/> Focus
                                    </button>
                                </div>
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