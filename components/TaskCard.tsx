import React from 'react';
import { StudyTask } from '../types';
import { BookIcon, LayersIcon, CalendarCheckIcon, SparklesIcon, CheckCircleIcon, FlameIcon, ArrowRightIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import { View } from '../App';

interface TaskCardProps {
    task: StudyTask;
    setView: (view: View) => void;
    onFocus: (task: StudyTask) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, setView, onFocus }) => {
    const { updateActiveUserProfile } = useAuth();

    const handleTaskAction = () => {
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
                setView('assignments');
                break;
            case 'manual':
                // Manual tasks don't have a default action
                break;
        }
    };
    
    const taskDetails = {
        review_weakness: { icon: SparklesIcon, color: 'text-yellow-500' },
        srs_review: { icon: LayersIcon, color: 'text-purple-500' },
        next_lesson: { icon: BookIcon, color: 'text-blue-500' },
        assignment: { icon: CalendarCheckIcon, color: 'text-red-500' },
        manual: { icon: BookIcon, color: 'text-slate-500' },
    };

    const { icon: Icon, color } = taskDetails[task.type];

    return (
        <div className={`flex items-center gap-4 transition-opacity ${task.isCompleted ? 'opacity-60' : ''}`}>
            {task.isCompleted ? (
                <CheckCircleIcon className="w-8 h-8 text-green-500 flex-shrink-0" />
            ) : (
                <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
            )}
            <div className="flex-grow">
                <p className={`font-bold text-slate-800 ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</p>
                <p className="text-sm text-slate-500">{task.subtitle}</p>
            </div>
            {!task.isCompleted && (
                 <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={handleTaskAction} className="btn text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5">
                        <ArrowRightIcon className="w-4 h-4" /> Go
                    </button>
                    <button onClick={() => onFocus(task)} className="btn text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center gap-1.5">
                        <FlameIcon className="w-4 h-4" /> Focus
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskCard;