import React, { useMemo, useState } from 'react';
import { useStudentData } from '../../contexts/StudentDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { StudyTask, FlashcardReviewItem, BktSkillState, TodayFocusWidgetConfig, UserFlashcardItem } from '../../types';
import { View } from '../../App';
import { LayersIcon, CalendarCheckIcon, SparklesIcon, BookIcon, FlameIcon, XIcon, CheckCircleIcon } from '../../constants/icons';
import FocusSessionModal from '../FocusSessionModal';

interface TodayFocusWidgetProps {
    widget: TodayFocusWidgetConfig;
    setView: (view: View) => void;
    onRemove: (id: string) => void;
}

const TodayFocusWidget: React.FC<TodayFocusWidgetProps> = ({ widget, setView, onRemove }) => {
    const { progressData, userFlashcards, userBktData } = useStudentData();
    const { activeProfile, allAssignments, updateActiveUserProfile } = useAuth();
    
    const [focusedTask, setFocusedTask] = useState<StudyTask | null>(null);
    const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

    const reviewItems = useMemo((): FlashcardReviewItem[] => {
        if (!userFlashcards) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // FIX: Explicitly type `items` to resolve `map` not existing on 'unknown'
        return Object.entries(userFlashcards).flatMap(([chapterId, items]: [string, UserFlashcardItem[]]) => 
            items.map((item, cardIndex) => ({ ...item, chapterId, cardIndex }))
                .filter(item => new Date(item.srsData.due) <= today)
        );
    }, [userFlashcards]);

    const todayTasks = useMemo((): StudyTask[] => {
        if (!activeProfile) return [];
        const todayStr = new Date().toISOString().split('T')[0];
        const tasks: StudyTask[] = [];

        if (reviewItems.length > 0) {
            tasks.push({ id: 'srs-review', type: 'srs_review', title: 'Review Flashcards', subtitle: `${reviewItems.length} cards due`, dueDate: todayStr });
        }

        const weakSkills = Object.entries(userBktData)
            // FIX: Explicitly type `data` to resolve `p_L` not existing on 'unknown'
            .filter(([, data]: [string, BktSkillState]) => data.p_L < 0.75)
            // FIX: Explicitly type `a` and `b` to resolve `p_L` not existing on 'unknown'
            .sort(([, a]: [string, BktSkillState], [, b]: [string, BktSkillState]) => a.p_L - b.p_L)
            .slice(0, 1);
        weakSkills.forEach(([skillId]) => {
            const [, , subject, ...parts] = skillId.split('-');
            tasks.push({ id: `bkt-${skillId}`, type: 'review_weakness', title: `Review: ${parts.join('-')}`, subtitle: `Weak area in ${subject}`, dueDate: todayStr, data: { chapterId: skillId } });
        });

        allAssignments.filter(a => a.classGrade === activeProfile.grade && a.dueDate === todayStr)
            .forEach(a => tasks.push({ id: `asgn-${a.id}`, type: 'assignment', title: a.title, subtitle: 'Assignment Due Today', dueDate: a.dueDate, data: { assignmentId: a.id } }));

        (activeProfile.manualTasks || []).forEach(t => tasks.push(t));

        return tasks.sort((a, b) => (a.type === 'assignment' ? -1 : 1));
    }, [activeProfile, reviewItems, userBktData, allAssignments]);
    
    const handleTaskAction = (task: StudyTask) => {
        if (task.type === 'srs_review') setView('planner'); // Planner component handles review queue
        else if (task.data?.chapterId) {
            const [, grade, subject, ...chapterParts] = task.data.chapterId.split('-');
            updateActiveUserProfile({ lastChapter: chapterParts.join('-'), lastSubject: subject, grade });
            setView('lesson');
        } else if (task.data?.assignmentId) setView('assignments');
    };
    
    const handleSessionComplete = (taskId: string) => {
        setCompletedToday(prev => new Set(prev).add(taskId));
        setFocusedTask(null);
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
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800">Today's Focus</h3>
                <button onClick={() => onRemove(widget.id)} className="p-1 text-slate-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
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
                        const [, , subject] = task.id.split('-');
                        const color = subjectColors[subject] || subjectColors['Default'];
                        const Icon = task.type === 'srs_review' ? LayersIcon : task.type === 'assignment' ? CalendarCheckIcon : task.type === 'review_weakness' ? SparklesIcon : BookIcon;
                        const isSessionCompleted = completedToday.has(task.id);

                        return (
                            <div key={task.id} className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${isSessionCompleted ? 'bg-green-50 border-green-200' : `${color.bg} ${color.border}`}`}>
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