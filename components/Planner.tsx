import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { ChapterProgress, FlashcardReviewItem, UserFlashcardItem, Assignment } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, BookIcon, CalendarCheckIcon, LayersIcon, RefreshCwIcon, PlusIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';
import { useAuth } from '../contexts/AuthContext';
import { View } from '../App';
import AddTaskModal from './AddTaskModal';

const ReviewQueue = React.lazy(() => import('./ReviewQueue'));

const PlayTimerIcon = ({ className }: { className?: string }) => ( <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5V19L19 12L8 5Z"></path></svg> );
const PauseTimerIcon = ({ className }: { className?: string }) => ( <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z"></path></svg> );

type AgendaItemType = 'deadline' | 'assignment' | 'review';
interface AgendaItem {
  id: string;
  type: AgendaItemType;
  title: string;
  subtitle: string;
  dueDate: string;
  data: any;
}
interface PlannerProps { setView: (view: View) => void; }

const Planner: React.FC<PlannerProps> = ({ setView }) => {
  const { progressData, userFlashcards } = useStudentData();
  const { activeProfile, allAssignments, updateActiveUserProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'agenda' | 'review'>('agenda');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Pomodoro Timer State
  const STUDY_MINUTES = 25;
  const BREAK_MINUTES = 5;
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(STUDY_MINUTES * 60);
  const [linkedTaskId, setLinkedTaskId] = useState('');
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
  }, []);

  const playAlertSound = useCallback(() => {
    audioRef.current?.play().catch(e => console.error("Error playing sound:", e));
  }, []);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    if (secondsLeft <= 0) {
        playAlertSound();
        if (mode === 'study') {
            setMode('break');
            setSecondsLeft(BREAK_MINUTES * 60);
        } else {
            setMode('study');
            setSecondsLeft(STUDY_MINUTES * 60);
        }
    }
  }, [secondsLeft, mode, playAlertSound]);

  const handleToggleTimer = () => setIsActive(!isActive);
  const handleResetTimer = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode('study');
    setSecondsLeft(STUDY_MINUTES * 60);
  };

  const subjectColors: { [key: string]: { bg: string, text: string, border: string } } = {
    'Science': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Maths': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'Social Studies': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Physics': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Chemistry': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'Biology': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    'Default': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
  };
  
  const handleTaskClick = (item: AgendaItem) => {
    if (item.type === 'review') {
        setViewMode('review');
    } else { // 'deadline' or 'assignment'
        const chapterId = item.id.startsWith('AS') ? item.data.assignedChapterIds[0] : item.id;
        if (!chapterId) return;

        const [, grade, subject, ...chapterParts] = chapterId.split('-');
        const chapter = chapterParts.join('-');
        
        updateActiveUserProfile({ lastChapter: chapter, lastSubject: subject, grade });
        setView('lesson');
    }
  };

  const reviewItems = useMemo((): FlashcardReviewItem[] => {
    if (!userFlashcards) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    const items: FlashcardReviewItem[] = [];

    for (const chapterId in userFlashcards) {
      userFlashcards[chapterId].forEach((item: UserFlashcardItem, index: number) => {
        if (item.srsData.due <= todayStr) {
          items.push({
            ...item,
            chapterId,
            cardIndex: index,
          });
        }
      });
    }
    return items;
  }, [userFlashcards]);
  
  const allScheduledItems = useMemo(() => {
    const items: AgendaItem[] = [];
    if (activeProfile) {
      // Personal Deadlines
      for (const [chapterId, chapterProgress] of Object.entries(progressData) as [string, ChapterProgress][]) {
        if (chapterProgress.dueDate && chapterProgress.status !== 'completed') {
          const [, grade, subject, ...chapterParts] = chapterId.split('-');
          items.push({ id: chapterId, type: 'deadline', title: chapterParts.join('-'), subtitle: `Personal Goal - ${subject}`, dueDate: chapterProgress.dueDate, data: {} });
        }
      }
      // School Assignments
      allAssignments.forEach(assignment => {
        const isForAll = !assignment.assignedStudentIds || assignment.assignedStudentIds.length === 0;
        const isForStudent = assignment.assignedStudentIds?.includes(activeProfile.id);
        if (assignment.classGrade === activeProfile.grade && (isForAll || isForStudent)) {
          const subtitle = assignment.assignmentType === 'quiz' ? `Quiz - ${assignment.quizQuestions?.length} Questions` : `Chapter Work`;
          items.push({ id: `AS-${assignment.id}`, type: 'assignment', title: assignment.title, subtitle, dueDate: assignment.dueDate, data: assignment });
        }
      });
    }
    return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [progressData, allAssignments, activeProfile]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    allScheduledItems.forEach(item => {
      const date = item.dueDate;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(item);
    });
    return map;
  }, [allScheduledItems]);
  
  const agendaItemsForSelectedDate = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const items = itemsByDate.get(dateStr) || [];
    const todayStr = new Date().toISOString().split('T')[0];
    if (reviewItems.length > 0 && dateStr === todayStr) {
        items.unshift({ id: 'review-queue', type: 'review', title: 'Review Flashcards', subtitle: `${reviewItems.length} cards due`, dueDate: todayStr, data: {} });
    }
    return items;
  }, [selectedDate, itemsByDate, reviewItems]);

  const upcomingItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allScheduledItems.filter(item => item.dueDate >= today).slice(0, 5);
  }, [allScheduledItems]);
  
  const linkedTask = useMemo(() => {
    if (!linkedTaskId) return null;
    // Search both all items and today's review item
    const allItems = [...allScheduledItems];
    if (reviewItems.length > 0) {
        allItems.push({ id: 'review-queue', type: 'review', title: 'Review Flashcards', subtitle: `${reviewItems.length} cards due`, dueDate: new Date().toISOString().split('T')[0], data: {} });
    }
    return allItems.find(item => item.id === linkedTaskId);
  }, [linkedTaskId, allScheduledItems, reviewItems]);

  // --- Calendar Rendering ---
  const CalendarNav = () => {
    const [currentDate, setCurrentDate] = useState(selectedDate);

    useEffect(() => {
        setCurrentDate(selectedDate);
    }, [selectedDate]);

    const changeMonth = (offset: number) => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="text-center p-1"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dayDateStr = dayDate.toISOString().split('T')[0];
      const isToday = isSameDay(dayDate, today);
      const isSelected = isSameDay(dayDate, selectedDate);
      const hasTasks = itemsByDate.has(dayDateStr) || (isToday && reviewItems.length > 0);

      calendarDays.push(
        <div key={day} className="text-center p-1 flex justify-center">
          <button
            onClick={() => setSelectedDate(dayDate)}
            className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors relative flex items-center justify-center
              ${isSelected ? 'bg-indigo-600 text-white' : ''}
              ${!isSelected && isToday ? 'bg-indigo-100 text-indigo-700' : ''}
              ${!isSelected && !isToday ? 'text-slate-700 hover:bg-slate-100' : ''}
            `}
          >
            {day}
            {hasTasks && <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`}></div>}
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeftIcon className="w-5 h-5" /></button>
          <h4 className="font-bold text-slate-800">{monthName}</h4>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100"><ArrowRightIcon className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays}
        </div>
      </div>
    );
  };
  
  if (viewMode === 'review') {
      return (
          <div className="animate-slide-in-up">
              <button onClick={() => setViewMode('agenda')} className="text-sm font-semibold text-indigo-600 hover:underline mb-4">&larr; Back to Agenda</button>
              <Suspense fallback={<p>Loading Review...</p>}>
                  <ReviewQueue reviewItems={reviewItems} />
              </Suspense>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_1.5fr)_minmax(0,_1fr)] xl:grid-cols-[320px_1fr_380px] gap-6 animate-slide-in-up">
      {/* Left Column: Calendar */}
      <div className="lg:col-span-1">
        <button onClick={() => setIsAddTaskModalOpen(true)} className="btn btn-primary w-full mb-4 flex items-center justify-center gap-2">
            <PlusIcon className="w-5 h-5" /> Add Task
        </button>
        <CalendarNav />
      </div>

      {/* Center Column: Agenda */}
      <div className="lg:col-span-1 xl:col-span-1">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Agenda for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
        <div className="space-y-3">
          {agendaItemsForSelectedDate.length === 0 ? (
            <p className="text-slate-500 text-center py-10">No tasks for today. Relax!</p>
          ) : (
            agendaItemsForSelectedDate.map(item => {
              const [,,,subject] = item.id.split('-');
              const color = subjectColors[subject] || subjectColors['Default'];
              const Icon = item.type === 'review' ? LayersIcon : item.type === 'assignment' ? CalendarCheckIcon : BookIcon;
              return (
                <div key={item.id} className={`w-full text-left p-3 rounded-lg border flex flex-col gap-3 transition-all ${color.bg} ${color.border}`}>
                    <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.bg} ${color.text} border ${color.border}`}><Icon className="w-5 h-5"/></div>
                        <div>
                            <p className={`font-semibold text-sm ${color.text}`}>{item.title}</p>
                            <p className="text-xs text-slate-500">{item.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-11">
                        <button onClick={() => handleTaskClick(item)} className="text-xs font-semibold text-indigo-600 hover:underline">View Task</button>
                        <span className="text-slate-300">&middot;</span>
                        <button onClick={() => setLinkedTaskId(item.id)} className="text-xs font-semibold text-indigo-600 hover:underline">Start Focus Session</button>
                    </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right Column: Tools */}
      <div className="lg:col-span-1 space-y-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-3">Upcoming</h3>
          <div className="space-y-2">
            {upcomingItems.length > 0 ? upcomingItems.map(item => (
              <div key={item.id} className="text-sm p-2 bg-slate-50 rounded-md">
                <p className="font-semibold text-slate-700 truncate">{item.title}</p>
                <p className="text-xs text-slate-500">{new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {item.subtitle}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
          </div>
        </div>
        {/* Pomodoro Timer */}
        <div className={`p-4 rounded-xl shadow-sm border transition-colors duration-500 ${mode === 'study' ? 'bg-indigo-50 border-indigo-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold">{mode === 'study' ? 'Study Session' : 'Break Time'}</h4>
            <button onClick={handleResetTimer} className="p-1 rounded-full hover:bg-slate-200 text-slate-500"><RefreshCwIcon className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="font-bold text-5xl font-mono tracking-tighter text-slate-800">{`${Math.floor(secondsLeft/60).toString().padStart(2,'0')}:${(secondsLeft%60).toString().padStart(2,'0')}`}</div>
            <button onClick={handleToggleTimer} className={`w-14 h-14 rounded-full text-white shadow-md flex items-center justify-center transition-colors ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {isActive ? <PauseTimerIcon className="w-7 h-7" /> : <PlayTimerIcon className="w-7 h-7" />}
            </button>
          </div>
          {linkedTask && (
              <div className="mt-3 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">Focused on:</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{linkedTask.title}</p>
              </div>
          )}
        </div>
      </div>
      {isAddTaskModalOpen && (
        <AddTaskModal
            isOpen={isAddTaskModalOpen}
            onClose={() => setIsAddTaskModalOpen(false)}
            initialDate={selectedDate}
        />
      )}
    </div>
  );
};

export default Planner;