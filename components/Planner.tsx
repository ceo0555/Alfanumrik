import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { ChapterProgress, FlashcardReviewItem, UserFlashcardItem } from '../types';
import { ArrowLeftIcon, ArrowRightIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';
import { useAuth } from '../contexts/AuthContext';

const ReviewQueue = React.lazy(() => import('./ReviewQueue'));

// Simple SVG-based play and pause icons for the timer button
const PlayTimerIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z"></path></svg>
);
const PauseTimerIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z"></path></svg>
);

const Planner: React.FC = () => {
  const { progressData, userFlashcards } = useStudentData();
  const { activeProfile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'review'>('calendar');

  // --- Pomodoro Timer State ---
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(studyMinutes * 60);
  const [linkedChapterId, setLinkedChapterId] = useState('');
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const subjectColors: { [key: string]: string } = {
      'Science': 'bg-blue-500',
      'Maths': 'bg-green-500',
      'Social Studies': 'bg-orange-500',
      'Physics': 'bg-red-500',
      'Chemistry': 'bg-yellow-500',
      'Biology': 'bg-teal-500',
  };

  const deadlines = useMemo(() => {
    const allDeadlines: { chapterId: string, chapter: string, subject: string, grade: string, dueDate: string }[] = [];
    // FIX: Using a for...of loop to iterate over entries, which can be more robust for type inference than .forEach with complex types.
    for (const [chapterId, chapterProgress] of Object.entries(progressData)) {
      // FIX: Explicitly cast chapterProgress as its type is not correctly inferred inside the loop.
      const progress = chapterProgress as ChapterProgress;
      if (progress.dueDate && progress.status !== 'completed') {
        const [, grade, subject, ...chapterParts] = chapterId.split('-');
        const chapter = chapterParts.join('-');
        allDeadlines.push({ chapterId, chapter, subject, grade, dueDate: progress.dueDate });
      }
    }
    return allDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [progressData]);

  const reviewItems = useMemo(() => {
    if (!userFlashcards) return [];
    const today = new Date().toISOString().split('T')[0];
    const items: FlashcardReviewItem[] = [];
    // FIX: Replaced .forEach with a for...of loop and added a type assertion to fix type inference issues.
    for (const [chapterId, deck] of Object.entries(userFlashcards)) {
        (deck as UserFlashcardItem[]).forEach((item, cardIndex) => {
// FIX: Corrected property from `nextReviewDate` to `due` to match the SrsData type.
            if (item.srsData.due <= today) {
                items.push({ ...item, chapterId, cardIndex });
            }
        });
    }
    return items;
  }, [userFlashcards]);

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, typeof deadlines>();
    deadlines.forEach(item => {
      const date = item.dueDate;
      if (!map.has(date)) {
        map.set(date, []);
      }
      map.get(date)!.push(item);
    });
    return map;
  }, [deadlines]);

  const playAlertSound = useCallback(() => {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioContextRef.current;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);

      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.type = 'sine';
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);

      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setSecondsLeft(mode === 'study' ? studyMinutes * 60 : breakMinutes * 60);
    }
  }, [studyMinutes, breakMinutes, mode, isActive]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
        document.title = `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')} | Alfanumrik`;
    } else {
        document.title = 'Alfanumrik';
    }

    if (secondsLeft === 0 && isActive) {
      playAlertSound();
      const nextMode = mode === 'study' ? 'break' : 'study';
      setMode(nextMode);
      setSecondsLeft(nextMode === 'study' ? studyMinutes * 60 : breakMinutes * 60);
    }
    return () => { document.title = 'Alfanumrik'; }
  }, [secondsLeft, mode, studyMinutes, breakMinutes, playAlertSound, isActive]);

  const handleToggleTimer = () => setIsActive(!isActive);

  const handleResetTimer = () => {
    setIsActive(false);
    setMode('study');
    setSecondsLeft(studyMinutes * 60);
  };
  
  const totalSeconds = mode === 'study' ? studyMinutes * 60 : breakMinutes * 60;
  const progressPercentage = (secondsLeft / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} className="h-24"></div>);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const dailyDeadlines = deadlinesByDate.get(dateStr);

      return (
        <div key={day} className="h-24 flex flex-col items-start p-2 text-sm rounded-lg relative group transition-colors border border-slate-100 bg-white">
          <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs ${isToday ? 'bg-[var(--brand-primary)] text-white font-bold' : 'text-slate-700'}`}>
            {day}
          </span>
          
          {dailyDeadlines && (
              <div className="mt-1 w-full space-y-1">
                  {dailyDeadlines.slice(0, 2).map((d, index) => (
                    <div key={index} className="w-full text-left p-1 rounded" style={{ backgroundColor: `${subjectColors[d.subject] || '#9ca3af'}20` }}>
                      <p className="text-xs font-semibold truncate" style={{ color: subjectColors[d.subject] || '#4b5563' }}>{d.chapter}</p>
                    </div>
                  ))}
                   {dailyDeadlines.length > 2 && <p className="text-xs text-slate-500 text-center mt-1">+ {dailyDeadlines.length - 2} more</p>}
              </div>
          )}
        </div>
      );
    });

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--border-color)]">
        <div className="flex justify-between items-center mb-4 px-2">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeftIcon className="w-5 h-5" /></button>
          <h3 className="font-bold text-lg text-slate-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100"><ArrowRightIcon className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks}
          {days}
        </div>
      </div>
    );
  };
  
  return (
    <div className="animate-slide-in-up space-y-6">
      {/* --- Pomodoro Timer UI --- */}
      <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-500 ${mode === 'study' ? 'bg-indigo-50 border-indigo-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle className="text-slate-200" strokeWidth="12" stroke="currentColor" fill="transparent" r="90" cx="100" cy="100" />
                <circle
                  className={`transition-all duration-500 ${mode === 'study' ? 'text-[var(--brand-primary)]' : 'text-green-500'}`}
                  strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round" stroke="currentColor" fill="transparent" r="90" cx="100" cy="100"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold text-slate-800 tracking-tighter">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </p>
                <p className={`font-semibold uppercase text-xs mt-1 ${mode === 'study' ? 'text-[var(--brand-primary)]' : 'text-green-600'}`}>
                  {mode === 'study' ? 'Focus' : 'Break'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleToggleTimer} className={`w-14 h-14 rounded-full text-white shadow-lg transform hover:scale-105 transition-transform ${isActive ? 'bg-red-500' : 'bg-[var(--brand-primary)]'}`}>
                {isActive ? <PauseTimerIcon className="w-7 h-7 mx-auto" /> : <PlayTimerIcon className="w-7 h-7 mx-auto" />}
              </button>
              <button onClick={handleResetTimer} className="text-slate-500 hover:text-slate-700 font-semibold text-xs">Reset</button>
            </div>
          </div>

          <div className="w-full md:w-64">
            <label htmlFor="task-link" className="block text-xs font-medium text-slate-600 mb-1">Link to a Task</label>
            <select id="task-link" value={linkedChapterId} onChange={e => setLinkedChapterId(e.target.value)} className="form-select w-full py-1" disabled={isActive}>
                <option value="">No specific task</option>
                {deadlines.map(d => (
                  <option key={d.chapterId} value={d.chapterId}>{d.chapter}</option>
                ))}
            </select>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-slate-500 hover:text-slate-700 text-xs">Timer Settings</summary>
              <div className="mt-2 p-3 bg-white/50 rounded-lg grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="focus-duration" className="block text-xs font-medium text-slate-600">Focus (min)</label>
                  <input type="number" id="focus-duration" value={studyMinutes} onChange={e => setStudyMinutes(Number(e.target.value))} className="form-input w-full mt-1 py-1 text-center" disabled={isActive} />
                </div>
                <div>
                  <label htmlFor="break-duration" className="block text-xs font-medium text-slate-600">Break (min)</label>
                  <input type="number" id="break-duration" value={breakMinutes} onChange={e => setBreakMinutes(Number(e.target.value))} className="form-input w-full mt-1 py-1 text-center" disabled={isActive} />
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="mb-4 border-b border-slate-200">
          <div className="flex items-center -mb-px">
              <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 font-semibold text-sm border-b-2 ${activeTab === 'calendar' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Calendar
              </button>
              <button onClick={() => setActiveTab('review')} className={`relative px-4 py-2 font-semibold text-sm border-b-2 ${activeTab === 'review' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  Review
                  {reviewItems.length > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px]">{reviewItems.length}</span>}
              </button>
          </div>
      </div>
      
      {activeTab === 'calendar' && renderCalendar()}
      {activeTab === 'review' && (
          <Suspense fallback={<p>Loading Review...</p>}>
              <ReviewQueue reviewItems={reviewItems} />
          </Suspense>
      )}

    </div>
  );
};

export default Planner;