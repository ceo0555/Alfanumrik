import React, { useState, useEffect, useRef } from 'react';
import { StudyTask } from '../types';
import { XIcon, RefreshCwIcon, FlameIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';

const PlayTimerIcon = ({ className }: { className?: string }) => ( <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5V19L19 12L8 5Z"></path></svg> );
const PauseTimerIcon = ({ className }: { className?: string }) => ( <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z"></path></svg> );

interface FocusSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: StudyTask;
  onSessionComplete: (taskId: string) => void;
}

const STUDY_MINUTES = 25;
const BREAK_MINUTES = 5;

const FocusSessionModal: React.FC<FocusSessionModalProps> = ({ isOpen, onClose, task, onSessionComplete }) => {
  // FIX: Renamed handleGamificationEvent to awardXP to match the context provider.
  const { awardXP } = useStudentData();
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(STUDY_MINUTES * 60);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      handleResetTimer();
      return;
    };
    
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
  }, [isActive, isOpen]);

  useEffect(() => {
    if (secondsLeft < 0) {
      if (mode === 'study') {
        awardXP('focus_session_completed');
        onSessionComplete(task.id);
        setMode('break');
        setSecondsLeft(BREAK_MINUTES * 60);
      } else {
        setMode('study');
        setSecondsLeft(STUDY_MINUTES * 60);
        setIsActive(false); // Pause after break
      }
    }
  }, [secondsLeft, mode, awardXP, onSessionComplete, task.id]);
  
  const handleToggleTimer = () => setIsActive(!isActive);
  const handleResetTimer = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode('study');
    setSecondsLeft(STUDY_MINUTES * 60);
  };
  
  if (!isOpen) return null;

  const totalSeconds = mode === 'study' ? STUDY_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FlameIcon className="w-6 h-6 text-orange-500" />
            Focus Hub
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </header>

        <div className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-500">Focused on:</p>
            <p className="font-bold text-slate-800 mb-6 truncate">{task.title}</p>
        
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <svg className="absolute inset-0" viewBox="0 0 36 36">
                    <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path className={mode === 'study' ? 'text-indigo-600' : 'text-green-500'}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${progress}, 100`} strokeLinecap="round"
                    />
                </svg>
                <div>
                    <p className="font-bold text-4xl font-mono tracking-tighter text-slate-800">
                        {`${Math.floor(secondsLeft/60).toString().padStart(2,'0')}:${(secondsLeft%60).toString().padStart(2,'0')}`}
                    </p>
                    <p className={`font-semibold text-sm ${mode === 'study' ? 'text-indigo-600' : 'text-green-500'}`}>
                        {mode === 'study' ? 'Study Session' : 'Break Time'}
                    </p>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
                <button onClick={handleResetTimer} className="p-3 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors">
                    <RefreshCwIcon className="w-5 h-5" />
                </button>
                <button onClick={handleToggleTimer} className={`w-16 h-16 rounded-full text-white shadow-lg flex items-center justify-center transition-transform transform hover:scale-105 ${isActive ? 'bg-red-500' : (mode === 'study' ? 'bg-indigo-600' : 'bg-green-500')}`}>
                    {isActive ? <PauseTimerIcon className="w-8 h-8" /> : <PlayTimerIcon className="w-8 h-8" />}
                </button>
                <button onClick={() => { onSessionComplete(task.id); }} className="p-3 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors">
                    Skip
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FocusSessionModal;