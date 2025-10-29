import React, { useState, useEffect, useRef } from 'react';
import { PracticeExam, QuestionPoolItem } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, EditIcon, FlameIcon } from '../constants/icons';

interface PracticeTakerProps {
    exam: PracticeExam;
    onFinishExam: (answers: { [q_id: string]: string }, infractions: number) => void;
    onBack: () => void;
}

const PracticeTaker: React.FC<PracticeTakerProps> = ({ exam, onFinishExam, onBack }) => {
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [q_id: string]: string }>({});
    const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState(exam.blueprint.durationMinutes * 60);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    // New states for Focus Mode
    const [infractions, setInfractions] = useState(0);
    const [isFocused, setIsFocused] = useState(true);

    // FIX: Initialize useRef with null to provide an initial value, which is better practice and avoids potential environment-specific errors.
    const timerRef = useRef<number | null>(null);
    const answersRef = useRef(answers);
    const infractionsRef = useRef(infractions);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        infractionsRef.current = infractions;
    }, [infractions]);

    // Focus and Fullscreen management
    useEffect(() => {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Fullscreen request failed: ${err.message}. Focus mode will still track tab visibility.`);
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setIsFocused(false);
                setInfractions(prev => prev + 1);
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFocused(false);
                setInfractions(prev => prev + 1);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        };
    }, []);

    // Timer logic updated for focus
    useEffect(() => {
        if (isFocused) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // FIX: Add a check for timerRef.current to ensure it's not null before calling clearInterval, satisfying TypeScript's strict null checks.
                        if (timerRef.current) clearInterval(timerRef.current);
                        onFinishExam(answersRef.current, infractionsRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isFocused, onFinishExam]);
    
    const currentQuestion = exam.questions[currentQIndex];

    const handleAnswerChange = (q_id: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [q_id]: answer }));
    };

    const navigateTo = (index: number) => {
        setCurrentQIndex(index);
        setIsPaletteOpen(false);
    };

    const handleNext = () => {
        if (currentQIndex < exam.questions.length - 1) {
            navigateTo(currentQIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentQIndex > 0) {
            navigateTo(currentQIndex - 1);
        }
    };
    
    const handleToggleReview = () => {
        setMarkedForReview(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentQuestion.q_id)) {
                newSet.delete(currentQuestion.q_id);
            } else {
                newSet.add(currentQuestion.q_id);
            }
            return newSet;
        });
    };
    
    const handleFinish = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        onFinishExam(answers, infractions);
    };

    const returnToFocus = () => {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFocused(true);
    };

    const getQuestionStatus = (q_id: string) => {
        if (markedForReview.has(q_id)) return 'review';
        if (answers[q_id]) return 'answered';
        return 'unanswered';
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };
    
    if (!isFocused) {
        return (
            <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-xl shadow-2xl">
                    <h2 className="text-2xl font-bold text-red-600">Focus Lost</h2>
                    <p className="text-slate-600 mt-2">Please return to the exam. Switching tabs or leaving fullscreen is not allowed.</p>
                    <p className="text-sm text-slate-500 mt-1">(This infraction has been recorded)</p>
                    <button onClick={returnToFocus} className="btn btn-primary mt-6">
                        I'm Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 bg-white p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="btn p-2 bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Back to setup">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg">{exam.blueprint.title}</h1>
                        <p className="text-sm text-slate-500">{exam.blueprint.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="font-mono text-xl font-bold bg-slate-100 px-3 py-1 rounded-lg">{formatTime(timeLeft)}</div>
                    <button onClick={handleFinish} className="btn bg-red-500 hover:bg-red-600 text-white">Finish Exam</button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Question Palette */}
                <div className={`w-64 bg-slate-50 border-r p-4 flex-shrink-0 flex-col overflow-y-auto ${isPaletteOpen ? 'flex' : 'hidden'} md:flex`}>
                     <div className="grid grid-cols-5 gap-2">
                        {exam.questions.map((q, i) => {
                            const status = getQuestionStatus(q.q_id);
                            const isCurrent = i === currentQIndex;
                            const statusClasses = {
                                answered: 'bg-emerald-500 text-white',
                                review: 'bg-purple-500 text-white',
                                unanswered: 'bg-white border-slate-300'
                            };
                            return (
                                <button
                                    key={q.q_id}
                                    onClick={() => navigateTo(i)}
                                    className={`w-10 h-10 rounded-lg font-bold text-sm border flex items-center justify-center transition-all ${statusClasses[status]} ${isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-6 text-xs space-y-2">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-500"/> Answered</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-500"/> Marked for Review</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border"/> Not Answered</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                    <div className="flex-grow">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">Question {currentQIndex + 1}</h2>
                            <span className="font-semibold bg-slate-100 px-3 py-1 rounded-full text-sm">{currentQuestion.marks} Marks</span>
                        </div>
                        <p className="text-lg mb-6">{currentQuestion.question}</p>

                        {currentQuestion.type === 'MCQ' && (
                            <div className="space-y-3">
                                {currentQuestion.options?.map((opt, i) => (
                                    <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${answers[currentQuestion.q_id] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                                        <input type="radio" name={currentQuestion.q_id} value={opt} checked={answers[currentQuestion.q_id] === opt} onChange={e => handleAnswerChange(currentQuestion.q_id, e.target.value)} className="w-5 h-5" />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {currentQuestion.type === 'SA' && (
                             <textarea
                                value={answers[currentQuestion.q_id] || ''}
                                onChange={e => handleAnswerChange(currentQuestion.q_id, e.target.value)}
                                rows={8}
                                className="form-textarea w-full"
                                placeholder="Type your answer here..."
                            />
                        )}
                    </div>

                    <footer className="flex-shrink-0 pt-6 border-t mt-6 flex justify-between items-center">
                        <button onClick={handlePrev} disabled={currentQIndex === 0} className="btn bg-white border border-slate-300 flex items-center gap-2 disabled:opacity-50">
                            <ArrowLeftIcon className="w-5 h-5"/> Previous
                        </button>
                        <button onClick={handleToggleReview} className={`btn flex items-center gap-2 ${markedForReview.has(currentQuestion.q_id) ? 'bg-purple-100 text-purple-700' : 'bg-white border'}`}>
                            <FlameIcon className="w-5 h-5"/> Mark for Review
                        </button>
                        <button onClick={handleNext} disabled={currentQIndex === exam.questions.length - 1} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
                            Save & Next <ArrowRightIcon className="w-5 h-5"/>
                        </button>
                    </footer>
                </div>
            </div>
             <button onClick={() => setIsPaletteOpen(p => !p)} className="md:hidden fixed bottom-4 right-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg z-10">
                <EditIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default PracticeTaker;