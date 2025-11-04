import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentData } from '../contexts/StudentDataContext';
import { View } from '../App';
import { PlusIcon, SparklesIcon, BookIcon, LayersIcon, CalendarCheckIcon, FlameIcon, CheckCircleIcon } from '../constants/icons';
import { PracticeBlueprint, StudyTask, WidgetConfig } from '../types';
import { generateWeeklyStudyPlan } from '../services/geminiService';

const AddTaskModal = React.lazy(() => import('./AddTaskModal'));
const FocusSessionModal = React.lazy(() => import('./FocusSessionModal'));

interface PlannerProps {
  setView: (view: View) => void;
  onStartPractice: (subject: string, blueprint: PracticeBlueprint) => void;
}

const Planner: React.FC<PlannerProps> = ({ setView, onStartPractice }) => {
  const { activeProfile, handleUpdateStudyPlan } = useAuth();
  const { userDktData, userFlashcards, allAssignments, awardXP } = useStudentData();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskDate, setAddTaskDate] = useState(new Date());
  const [focusedTask, setFocusedTask] = useState<StudyTask | null>(null);
  const [completedSessionTasks, setCompletedSessionTasks] = useState<Set<string>>(new Set());

  const studyPlan = activeProfile?.studyPlan || [];

  const handleGeneratePlan = async () => {
    if (!activeProfile) return;
    setIsLoading(true);
    try {
      const plan = await generateWeeklyStudyPlan(activeProfile, userDktData, userFlashcards, allAssignments);
      handleUpdateStudyPlan(plan);
    } catch (e) {
      console.error("Failed to generate study plan", e);
      alert("Sorry, there was an error generating your study plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = (taskData: Omit<StudyTask, 'id' | 'type' | 'isCompleted'>) => {
    const newTask: StudyTask = {
        ...taskData,
        id: `manual-${Date.now()}`,
        type: 'manual',
        isCompleted: false,
    };
    handleUpdateStudyPlan([...studyPlan, newTask]);
    setIsAddTaskModalOpen(false);
  };

  const handleToggleComplete = (taskId: string) => {
    const updatedPlan = studyPlan.map(task => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    handleUpdateStudyPlan(updatedPlan);
  };
  
  const handleSessionComplete = (taskId: string) => {
    if (!completedSessionTasks.has(taskId)) {
        awardXP('focus_session_completed');
        setCompletedSessionTasks(prev => new Set(prev).add(taskId));
    }
    setFocusedTask(null);
  };
  
  const handleTaskAction = (task: StudyTask) => {
      if (task.type === 'srs_review') setView('studio');
      else if (task.data?.chapterId) {
          const [, grade, subject, ...chapterParts] = task.data.chapterId.split('-');
          // updateActiveUserProfile({ lastChapter: chapterParts.join('-'), lastSubject: subject, grade });
          setView('lesson');
      } else if (task.data?.assignmentId) setView('assignments');
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  
  const tasksByDay = useMemo(() => {
    const grouped: { [key: string]: StudyTask[] } = {};
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday

    for (let i=0; i<7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dayStr = day.toISOString().split('T')[0];
        grouped[dayStr] = [];
    }

    studyPlan.forEach(task => {
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      if (grouped[taskDate]) {
        grouped[taskDate].push(task);
      }
    });
    return grouped;
  }, [studyPlan, today]);

  const TaskIcon: React.FC<{type: StudyTask['type']}> = ({ type }) => {
    const icons = {
      review_weakness: SparklesIcon,
      srs_review: LayersIcon,
      assignment: CalendarCheckIcon,
      next_lesson: BookIcon,
      manual: BookIcon,
    };
    const Icon = icons[type] || BookIcon;
    return <Icon className="w-4 h-4" />;
  }

  return (
    <div className="animate-slide-in-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800">Weekly Planner</h1>
        <button onClick={handleGeneratePlan} disabled={isLoading} className="btn btn-primary flex items-center justify-center gap-2">
          <SparklesIcon className="w-5 h-5" /> {isLoading ? "Generating..." : "Generate My Week"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 bg-white p-2 rounded-xl border shadow-sm">
        {daysOfWeek.map((dayName, i) => {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay() + 1);
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + i);
          const dayStr = dayDate.toISOString().split('T')[0];
          const tasks = tasksByDay[dayStr] || [];
          const isToday = dayDate.toDateString() === today.toDateString();

          return (
            <div key={dayName} className={`p-2 rounded-lg ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
              <p className={`font-bold text-center mb-2 ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>{dayName}</p>
              <div className="space-y-2 min-h-[200px]">
                {tasks.map(task => (
                  <div key={task.id} className={`p-2 rounded-md bg-white border-l-4 transition-all ${task.isCompleted ? 'border-green-400 opacity-70' : 'border-indigo-400'}`}>
                    <div className="flex items-start gap-2">
                      <button onClick={() => handleToggleComplete(task.id)} className="mt-1">
                        {task.isCompleted ? <CheckCircleIcon className="w-4 h-4 text-green-500"/> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"/>}
                      </button>
                      <div>
                        <p className={`text-xs font-semibold leading-tight ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1"><TaskIcon type={task.type} /> {task.subtitle}</p>
                      </div>
                    </div>
                     <div className="flex gap-1 justify-end mt-1">
                        <button onClick={() => handleTaskAction(task)} className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600">View</button>
                        <button onClick={() => setFocusedTask(task)} className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600">Focus</button>
                    </div>
                  </div>
                ))}
                 <button onClick={() => { setAddTaskDate(dayDate); setIsAddTaskModalOpen(true); }} className="w-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md p-1 flex items-center justify-center gap-1 text-xs">
                    <PlusIcon className="w-3 h-3"/> Add Task
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {isAddTaskModalOpen && (
        <Suspense>
          <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} initialDate={addTaskDate} />
        </Suspense>
      )}

      {focusedTask && (
        <Suspense>
          <FocusSessionModal isOpen={!!focusedTask} onClose={() => setFocusedTask(null)} task={focusedTask} onSessionComplete={handleSessionComplete} />
        </Suspense>
      )}
    </div>
  );
};

export default Planner;
