import React, { useState, useMemo, Suspense } from 'react';
import { StudyTask, FlashcardReviewItem, UserFlashcardItem, UserBktData, BktSkillState } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, BookIcon, CalendarCheckIcon, LayersIcon, SparklesIcon, PlusIcon, FlameIcon, TargetIcon, CheckCircleIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';
import { useAuth } from '../contexts/AuthContext';
import { View } from '../App';
import AddTaskModal from './AddTaskModal';
import { curriculum } from '../constants/curriculum';
import { p_L0 } from '../services/bkt';
import FocusSessionModal from './FocusSessionModal';

const ReviewQueue = React.lazy(() => import('./ReviewQueue'));

interface PlannerProps { setView: (view: View) => void; }

const Planner: React.FC<PlannerProps> = ({ setView }) => {
  const { progressData, userFlashcards, userBktData } = useStudentData();
  const { activeProfile, allAssignments, updateActiveUserProfile } = useAuth();

  const [viewMode, setViewMode] = useState<'today' | 'review'>('today');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [focusedTask, setFocusedTask] = useState<StudyTask | null>(null);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  const subjectColors: { [key: string]: { bg: string, text: string, border: string } } = {
    'Science': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Maths': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'Social Studies': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Default': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
  };

  const handleTaskAction = (task: StudyTask) => {
    if (task.type === 'srs_review') {
      setViewMode('review');
    } else if (task.data?.chapterId) {
      const [, grade, subject, ...chapterParts] = task.data.chapterId.split('-');
      updateActiveUserProfile({ lastChapter: chapterParts.join('-'), lastSubject: subject, grade });
      setView('lesson');
    } else if (task.data?.assignmentId) {
      setView('assignments');
    }
  };
  
  const handleSessionComplete = (taskId: string) => {
    setCompletedToday(prev => new Set(prev).add(taskId));
    setFocusedTask(null);
  };
  
  const reviewItems = useMemo((): FlashcardReviewItem[] => {
    if (!userFlashcards) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
    const dueItems: FlashcardReviewItem[] = [];

    for (const chapterId in userFlashcards) {
      userFlashcards[chapterId].forEach((item, cardIndex) => {
        const dueDate = new Date(item.srsData.due);
        if (dueDate <= today) {
          dueItems.push({ ...item, chapterId, cardIndex });
        }
      });
    }
    return dueItems;
  }, [userFlashcards]);

  const todayTasks = useMemo((): StudyTask[] => {
    if (!activeProfile) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    const tasks: StudyTask[] = [];

    // 1. SRS Review
    if (reviewItems.length > 0) {
      tasks.push({ id: 'srs-review', type: 'srs_review', title: 'Review Flashcards', subtitle: `${reviewItems.length} cards due today`, dueDate: todayStr });
    }

    // 2. BKT Weakness
    const weakSkills = Object.entries(userBktData)
      .filter(([, data]: [string, BktSkillState]) => data.p_L < 0.75)
      .sort(([, aData]: [string, BktSkillState], [, bData]: [string, BktSkillState]) => aData.p_L - bData.p_L)
      .slice(0, 2);

    weakSkills.forEach(([skillId]) => {
      const [, , subject, ...chapterParts] = skillId.split('-');
      tasks.push({ id: `bkt-${skillId}`, type: 'review_weakness', title: `Review: ${chapterParts.join('-')}`, subtitle: `Weak area in ${subject}`, dueDate: todayStr, data: { chapterId: skillId } });
    });

    // 3. Assignments
    allAssignments.forEach(a => {
      if (a.classGrade === activeProfile.grade) {
        tasks.push({ id: `asgn-${a.id}`, type: 'assignment', title: a.title, subtitle: 'Upcoming Assignment', dueDate: a.dueDate, data: { assignmentId: a.id } });
      }
    });
    
    // 4. Manual Tasks
    (activeProfile.manualTasks || []).forEach(t => {
        tasks.push(t);
    });

    // Filter for today and sort
    return tasks
      .filter(t => t.dueDate === todayStr)
      .sort((a, b) => (a.type === 'assignment' ? -1 : 1)); // Prioritize assignments

  }, [activeProfile, reviewItems, userBktData, allAssignments]);


  if (viewMode === 'review') {
      return (
          <div className="animate-slide-in-up">
              <button onClick={() => setViewMode('today')} className="text-sm font-semibold text-indigo-600 hover:underline mb-4">&larr; Back to Today's Plan</button>
              <Suspense fallback={<p>Loading Review...</p>}>
                  <ReviewQueue reviewItems={reviewItems} />
              </Suspense>
          </div>
      );
  }

  return (
    <div className="animate-slide-in-up">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-extrabold text-slate-800">Smart Study Plan</h1>
        <button onClick={() => setIsAddTaskModalOpen(true)} className="btn btn-primary flex items-center justify-center gap-2">
            <PlusIcon className="w-5 h-5" /> Add Manual Task
        </button>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Today's Focus</h2>
        <div className="space-y-3">
          {todayTasks.length === 0 ? (
            <p className="text-slate-500 text-center py-10">Nothing on the plan for today. Great job staying on top of things!</p>
          ) : (
            todayTasks.map(task => {
              const [,,,subject] = task.id.split('-');
              const color = subjectColors[subject] || subjectColors['Default'];
              const Icon = task.type === 'srs_review' ? LayersIcon : task.type === 'assignment' ? CalendarCheckIcon : task.type === 'review_weakness' ? SparklesIcon : BookIcon;
              const isSessionCompleted = completedToday.has(task.id);

              return (
                <div key={task.id} className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all ${isSessionCompleted ? 'bg-green-50 border-green-200' : `${color.bg} ${color.border}`}`}>
                    <div className="flex items-start gap-3 flex-grow">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSessionCompleted ? 'bg-green-100 text-green-600' : `${color.bg} ${color.text} border ${color.border}`}`}>
                            {isSessionCompleted ? <CheckCircleIcon className="w-6 h-6"/> : <Icon className="w-6 h-6"/>}
                        </div>
                        <div>
                            <p className={`font-semibold ${isSessionCompleted ? 'text-green-800' : color.text}`}>{task.title}</p>
                            <p className="text-xs text-slate-500">{task.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
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
      </div>
      
      {isAddTaskModalOpen && (
        <AddTaskModal
            isOpen={isAddTaskModalOpen}
            onClose={() => setIsAddTaskModalOpen(false)}
            initialDate={new Date()}
        />
      )}
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

export default Planner;