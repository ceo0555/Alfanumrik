import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StudyTask } from '../types';
import { View } from '../App';
import { FlameIcon, ArrowRightIcon, BookIcon } from '../constants/icons';
import TaskCard from './TaskCard';
import FocusSessionModal from './FocusSessionModal';
import { useStudentData } from '../contexts/StudentDataContext';
import StudyPet from './StudyPet';

const GreetingHeader: React.FC<{ name: string }> = ({ name }) => (
    <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">Welcome back, {name}!</h1>
        <p className="text-slate-500 mt-1">Let's make today a productive day.</p>
    </div>
);

const ContinueLearningCard: React.FC<{ subject: string; chapter: string; onClick: () => void }> = ({ subject, chapter, onClick }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <BookIcon className="w-5 h-5 text-indigo-500"/>
                <h3 className="font-bold text-slate-800">Continue Learning</h3>
            </div>
            <p className="font-semibold text-slate-700">{chapter}</p>
            <p className="text-sm text-slate-500">{subject}</p>
        </div>
        <button onClick={onClick} className="btn btn-primary w-full mt-4 text-sm">
            Pick up where you left off
        </button>
    </div>
);

const StreakCard: React.FC<{ streak: number }> = ({ streak }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 text-center h-full flex flex-col justify-center">
        <FlameIcon className="w-10 h-10 text-orange-500 mx-auto" />
        <p className="text-4xl font-extrabold text-slate-800 mt-2">{streak}</p>
        <p className="font-semibold text-slate-500 text-sm">Day Streak!</p>
    </div>
);

const StudentDashboard: React.FC = () => {
    const { activeProfile, setView, updateActiveUserProfile } = useAuth();
    const { todayTasks } = useStudentData();
    const [focusedTask, setFocusedTask] = useState<StudyTask | null>(null);
    const [completedSessionTasks, setCompletedSessionTasks] = useState<Set<string>>(new Set());

    const tasksToDisplay = useMemo(() => {
        return todayTasks.filter(task => !completedSessionTasks.has(task.id));
    }, [todayTasks, completedSessionTasks]);
    
    const handleSessionComplete = (taskId: string) => {
        setCompletedSessionTasks(prev => new Set(prev).add(taskId));
        setFocusedTask(null);
    };

    const handleContinueLearning = () => {
        if (!activeProfile) return;
        updateActiveUserProfile({ 
            lastChapter: activeProfile.lastChapter, 
            lastSubject: activeProfile.lastSubject, 
            grade: activeProfile.grade 
        });
        setView('lesson');
    };

    if (!activeProfile) return null;

    return (
        <div className="animate-slide-in-up">
            <GreetingHeader name={activeProfile.name} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="md:col-span-2 lg:col-span-2">
                    <ContinueLearningCard 
                        subject={activeProfile.lastSubject} 
                        chapter={activeProfile.lastChapter}
                        onClick={handleContinueLearning}
                    />
                </div>
                <div className="lg:col-span-1">
                    <StreakCard streak={activeProfile.currentStreak} />
                </div>
                 <div className="lg:col-span-1">
                    <StudyPet accessories={activeProfile.unlockedPetAccessories || []} />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-700 mb-4">Today's Plan</h2>
                {tasksToDisplay.length > 0 ? (
                    <div className="space-y-3">
                        {tasksToDisplay.map(task => (
                            <div key={task.id} className="p-3 bg-white rounded-xl shadow-sm border">
                                <TaskCard task={task} setView={setView} onFocus={setFocusedTask} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-green-50 border border-green-200 rounded-xl">
                        <h2 className="text-lg font-bold text-green-800">All Done for Today!</h2>
                        <p className="text-green-700">Great job completing all your scheduled tasks.</p>
                    </div>
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

export default StudentDashboard;