import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useStudentData } from './contexts/StudentDataContext';
import { View } from './App';
import { PlusIcon, SparklesIcon, BookIcon, LayersIcon, CalendarCheckIcon, FlameIcon, CheckCircleIcon } from './constants/icons';
import { PracticeBlueprint, StudyTask } from './types';
import { generateWeeklyStudyPlan } from './services/geminiService';
import Loader from './components/Loader';

const AddTaskModal = React.lazy(() => import('./components/AddTaskModal'));
const FocusSessionModal = React.lazy(() => import('./components/FocusSessionModal'));

interface PlannerProps {
  setView: (view: View) => void;
  onStartPractice: (subject: string, blueprint: PracticeBlueprint) => void;
}

const Planner: React.FC<PlannerProps> = ({ setView, onStartPractice }) => {
  const { activeProfile, handleUpdateStudyPlan, allAssignments, updateActiveUserProfile } = useAuth();
  const { userDktData, userFlashcards } = useStudentData();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskDate, setAddTaskDate] = useState(new Date());
  const [focusedTask, setFocusedTask] = useState<StudyTask | null>(null);

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
    handleUpdateStudyPlan(studyPlan.map(task => 
      task.id === taskId ? { ...task, isCompleted: true } : task
    ));
    setFocusedTask(null);
  };
  
  const handleTaskAction = (task: StudyTask) => {
      if (task.type === 'srs_review') setView('studio');
      else if (task.data?.chapterId) {
          const [, grade, subject, ...chapterParts] = task.data.chapterId.split('-');
          updateActiveUserProfile({ lastChapter: chapterParts.join('-'), lastSubject: subject, grade });
          setView('lesson');
      } else if (task.data?.assignmentId) setView('academics');
  };

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Monday

  const days = Array.from({ length: 7 }).map((_, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    return dayDate;
  });

  const tasksByDay = useMemo(() => {
    const grouped: { [key: string]: StudyTask[] } = {};
    days.forEach(day => {
        grouped[day.toISOString().split('T')[0]] = [];
    });

    studyPlan.forEach(task => {
      const taskDateStr = new Date(task.dueDate).toISOString().split('T')[0];
      const taskDate = new Date(task.dueDate + "T00:00:00"); // Ensure date is parsed correctly
      if (grouped[taskDateStr]) {
        grouped[taskDateStr].push(task);
      }
    });
    return grouped;
  }, [studyPlan, days]);

  const TaskIcon: React.FC<{type: StudyTask['type']}> = ({ type }) => {
    const icons = { review_weakness: SparklesIcon, srs_review: LayersIcon, assignment: CalendarCheckIcon, next_lesson: BookIcon, manual: BookIcon };
    const Icon = icons[type] || BookIcon;
    return <Icon className="w-4 h-4" />;
  };

  const TaskItem: React.FC<{task: StudyTask}> = ({ task }) => (
    <div className={`p-2 rounded-md bg-white border-l-4 transition-all ${task.isCompleted ? 'border-green-400 opacity-70' : 'border-indigo-400'}`}>
        <div className="flex items-start gap-2">
            <button onClick={() => handleToggleComplete(task.id)} className="mt-1 flex-shrink-0">
                {task.isCompleted ? <CheckCircleIcon className="w-4 h-4 text-green-500"/> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"/>}
            </button>
            <div>
                <p className={`text-xs font-semibold leading-tight ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1"><TaskIcon type={task.type} /> {task.subtitle}</p>
            </div>
        </div>
        {!task.isCompleted && (
            <div className="flex gap-1 justify-end mt-1">
                <button onClick={() => handleTaskAction(task)} className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600">View</button>
                <button onClick={() => setFocusedTask(task)} className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600">Focus</button>
            </div>
        )}
    </div>
  );

  return (
    <div className="relative animate-slide-in-up">
        {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Loader />
            </div>
        )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800">Weekly Planner</h1>
        <button onClick={handleGeneratePlan} disabled={isLoading} className="btn btn-primary flex items-center justify-center gap-2">
          <SparklesIcon className="w-5 h-5" /> {isLoading ? "Generating..." : "Generate My Week"}
        </button>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:grid grid-cols-7 gap-2 bg-white p-2 rounded-xl border shadow-sm">
        {days.map(dayDate => {
          const dayStr = dayDate.toISOString().split('T')[0];
          const tasks = tasksByDay[dayStr] || [];
          const isToday = dayDate.toDateString() === today.toDateString();
          return (
            <div key={dayStr} className={`p-2 rounded-lg ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
              <p className={`font-bold text-center mb-2 ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>{dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <div className="space-y-2 min-h-[200px]">
                {tasks.map(task => <TaskItem key={task.id} task={task} />)}
                 <button onClick={() => { setAddTaskDate(dayDate); setIsAddTaskModalOpen(true); }} className="w-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md p-1 flex items-center justify-center gap-1 text-xs">
                    <PlusIcon className="w-3 h-3"/> Add Task
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile Accordion View */}
      <div className="md:hidden space-y-2">
        {days.map(dayDate => {
             const dayStr = dayDate.toISOString().split('T')[0];
             const tasks = tasksByDay[dayStr] || [];
             const isToday = dayDate.toDateString() === today.toDateString();
             return (
                <details key={dayStr} open={isToday} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <summary className={`p-3 cursor-pointer list-none flex justify-between items-center ${isToday ? 'bg-indigo-50' : ''}`}>
                        <div className="font-bold text-slate-700">{dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                        <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{tasks.length} tasks</span>
                    </summary>
                    <div className="p-3 border-t space-y-2">
                         {tasks.length > 0 ? tasks.map(task => <TaskItem key={task.id} task={task} />) : <p className="text-xs text-slate-500 text-center py-4">No tasks for today.</p>}
                         <button onClick={() => { setAddTaskDate(dayDate); setIsAddTaskModalOpen(true); }} className="w-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md p-1 flex items-center justify-center gap-1 text-xs mt-2">
                            <PlusIcon className="w-3 h-3"/> Add Task
                        </button>
                    </div>
                </details>
             )
        })}
      </div>


      {isAddTaskModalOpen && (
        <Suspense>
          <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} initialDate={addTaskDate} onAddTask={handleAddTask} />
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