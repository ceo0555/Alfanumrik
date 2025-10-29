import React, { useState, useEffect } from 'react';
import { QuizState, QuestionPoolItem } from '../types';
import { curriculum } from '../constants/curriculum';
import { generateAdaptiveQuestion } from '../services/geminiService';
import { ClipboardCheckIcon, ThumbsUpIcon, ThumbsDownIcon } from '../constants/icons';

const MAX_QUESTIONS = 10; // Failsafe to prevent infinitely long quizzes

const DifficultyBadge: React.FC<{ difficulty: 'E' | 'M' | 'H' }> = ({ difficulty }) => {
  const baseClasses = "px-2 py-0.5 text-xs font-semibold rounded-full";
  const colorClasses = {
    H: 'bg-red-100 text-red-800',
    M: 'bg-yellow-100 text-yellow-800',
    E: 'bg-green-100 text-green-800',
  };
  const text = { H: 'Hard', M: 'Medium', E: 'Easy' };
  return <span className={`${baseClasses} ${colorClasses[difficulty]}`}>{text[difficulty]}</span>;
};

const AdaptiveQuizGenerator: React.FC = () => {
    const [quizState, setQuizState] = useState<QuizState>('setup');
    
    // Setup State
    const [selectedGrade, setSelectedGrade] = useState(Object.keys(curriculum)[0]);
    const [availableSubjects, setAvailableSubjects] = useState(Object.keys(curriculum[selectedGrade]));
    const [selectedSubject, setSelectedSubject] = useState(availableSubjects[0]);
    const [availableChapters, setAvailableChapters] = useState(curriculum[selectedGrade][selectedSubject]);
    const [selectedChapter, setSelectedChapter] = useState(availableChapters[0]);

    // Active Quiz State
    const [currentQuestion, setCurrentQuestion] = useState<QuestionPoolItem | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [nextDifficulty, setNextDifficulty] = useState<'E' | 'M' | 'H'>('M');
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState<(QuestionPoolItem & { userAnswer: string; isCorrect: boolean; })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Answer State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [shortAnswerText, setShortAnswerText] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean, correctAnswer: string, rubric: string } | null>(null);

    // Update subjects when grade changes
    useEffect(() => {
        const subjects = Object.keys(curriculum[selectedGrade]);
        setAvailableSubjects(subjects);
        setSelectedSubject(subjects[0]);
    }, [selectedGrade]);

    // Update chapters when subject changes
    useEffect(() => {
        const chapters = curriculum[selectedGrade][selectedSubject];
        setAvailableChapters(chapters);
        setSelectedChapter(chapters[0]);
    }, [selectedSubject, selectedGrade]);

    const fetchNextQuestion = async (difficulty: 'E' | 'M' | 'H') => {
        setIsLoading(true);
        setError('');
        setCurrentQuestion(null);
        try {
            const previousQuestions = history.map(h => h.question);
            const question = await generateAdaptiveQuestion(selectedGrade, selectedSubject, selectedChapter, difficulty, previousQuestions);
            setCurrentQuestion(question);
            setQuestionNumber(prev => prev + 1);
        } catch (err) {
            console.error(err);
            setError('Failed to generate the next question. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startQuiz = () => {
        setQuizState('active');
        setQuestionNumber(0);
        setScore(0);
        setHistory([]);
        setNextDifficulty('M');
        fetchNextQuestion('M');
    };

    const handleSubmitAnswer = () => {
        if (!currentQuestion || isAnswered) return;

        let isCorrect = false;
        let userAnswer = '';

        if (currentQuestion.type === 'MCQ') {
            userAnswer = selectedOption || '';
            isCorrect = userAnswer === currentQuestion.answer;
        } else if (currentQuestion.type === 'SA') {
            userAnswer = shortAnswerText;
            isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
        }

        setIsAnswered(true);
        setFeedback({ isCorrect, correctAnswer: currentQuestion.answer, rubric: currentQuestion.rubric });

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setHistory(prev => [...prev, { ...currentQuestion, userAnswer, isCorrect }]);

        // Adaptive logic to determine next difficulty.
        // This logic ensures the quiz gets easier on a wrong answer and harder on a right answer (up to 'Hard').
        let newNextDifficulty: 'E' | 'M' | 'H';
        if (isCorrect) {
            // Correct answer: Increase difficulty
            switch (currentQuestion.difficulty) {
                case 'E':
                    newNextDifficulty = 'M';
                    break;
                case 'M':
                    newNextDifficulty = 'H';
                    break;
                case 'H':
                    newNextDifficulty = 'H'; // Stay at Hard, as it's the highest level
                    break;
            }
        } else {
            // Incorrect answer: Decrease difficulty
            switch (currentQuestion.difficulty) {
                case 'H':
                    newNextDifficulty = 'M';
                    break;
                case 'M':
                    newNextDifficulty = 'E';
                    break;
                case 'E':
                    newNextDifficulty = 'E'; // Stay at Easy, as it's the lowest level
                    break;
            }
        }
        setNextDifficulty(newNextDifficulty);
    };

    const handleNext = () => {
        // Reset state for the new question
        setIsAnswered(false);
        setSelectedOption(null);
        setShortAnswerText('');
        setFeedback(null);

        const lastAnswered = history[history.length - 1];
        const masteryAchieved = lastAnswered.isCorrect && lastAnswered.difficulty === 'H';

        if (masteryAchieved || questionNumber >= MAX_QUESTIONS) {
            setQuizState('results');
        } else {
            fetchNextQuestion(nextDifficulty);
        }
    };

    const getOptionClasses = (option: string) => {
        if (!isAnswered) {
          return selectedOption === option
            ? 'ring-2 ring-[var(--brand-primary)] bg-[var(--brand-secondary)]'
            : 'hover:bg-slate-100';
        }
        if (option === currentQuestion?.answer) {
          return 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 cursor-not-allowed';
        }
        if (option === selectedOption && option !== currentQuestion?.answer) {
          return 'bg-red-100 text-red-800 ring-2 ring-red-500 cursor-not-allowed';
        }
        return 'bg-slate-50 cursor-not-allowed';
    };
    
    const isSubmitDisabled = isAnswered || 
        (currentQuestion?.type === 'MCQ' && !selectedOption) || 
        (currentQuestion?.type === 'SA' && !shortAnswerText.trim());

    if (quizState === 'setup') {
        return (
            <div className="text-center max-w-lg mx-auto">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Adaptive Quiz Generator</h3>
                <p className="text-slate-500 mb-6">Create a personalized quiz that adapts to your skill level.</p>
                <div className="space-y-4 text-left">
                    <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-slate-700">Grade</label>
                        <select id="grade" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="form-select mt-1 block w-full">
                            {Object.keys(curriculum).map(g => <option key={g} value={g}>Class {g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Subject</label>
                        <select id="subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="form-select mt-1 block w-full">
                            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="chapter" className="block text-sm font-medium text-slate-700">Chapter</label>
                        <select id="chapter" value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className="form-select mt-1 block w-full">
                           {availableChapters.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={startQuiz} className="btn btn-primary mt-6 w-full">Start Quiz</button>
            </div>
        );
    }

    if (quizState === 'active') {
        const lastAnswered = history.length > 0 ? history[history.length - 1] : null;
        const isMasteryAchieved = lastAnswered ? lastAnswered.isCorrect && lastAnswered.difficulty === 'H' : false;
        const shouldEndQuiz = isMasteryAchieved || questionNumber >= MAX_QUESTIONS;

        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">{selectedChapter} Quiz</h3>
                    <div>
                        <span className="font-semibold">Score: {score} / {history.length}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="font-semibold">Question: {questionNumber}</span>
                    </div>
                </div>
                {isLoading && <div className="text-center p-8"><div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[var(--brand-primary)] mx-auto"></div><p className="mt-4 text-slate-500">Generating Question...</p></div>}
                
                {error && !isLoading && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
                        <p className="font-semibold">{error}</p>
                        <button 
                            onClick={() => fetchNextQuestion(nextDifficulty)} 
                            className="btn btn-primary bg-red-600 hover:bg-red-700 mt-4"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!isLoading && !error && currentQuestion && (
                    <div className="bg-white p-6 rounded-lg border">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-lg font-semibold text-slate-800">{currentQuestion.question}</p>
                            <DifficultyBadge difficulty={currentQuestion.difficulty}/>
                        </div>

                        {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedOption(option)}
                                        disabled={isAnswered}
                                        className={`w-full text-left p-3 rounded-lg border border-slate-200 transition-all ${getOptionClasses(option)}`}
                                    >
                                        <span className="font-mono mr-3 text-[var(--brand-primary)]">{String.fromCharCode(65 + index)}.</span>
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {currentQuestion.type === 'SA' && (
                            <textarea
                                className="form-textarea w-full p-3 rounded-lg"
                                rows={4}
                                placeholder="Type your answer here..."
                                value={shortAnswerText}
                                onChange={(e) => setShortAnswerText(e.target.value)}
                                disabled={isAnswered}
                            />
                        )}

                        {isAnswered ? (
                            <div className="mt-6 text-right">
                                <button onClick={handleNext} className="btn btn-primary">
                                    {shouldEndQuiz ? 'Show Results' : 'Next Question'}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-6 text-right">
                                <button onClick={handleSubmitAnswer} disabled={isSubmitDisabled} className="btn btn-primary">
                                    Submit Answer
                                </button>
                            </div>
                        )}
                        
                        {isAnswered && feedback && (
                            <div className={`mt-4 p-4 rounded-lg border ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                <h4 className={`font-bold flex items-center gap-2 ${feedback.isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                                    {feedback.isCorrect ? <ThumbsUpIcon className="w-5 h-5" /> : <ThumbsDownIcon className="w-5 h-5" />}
                                    <span>{feedback.isCorrect ? 'Correct!' : 'Incorrect'}</span>
                                </h4>
                                <p className="mt-2 text-sm text-slate-600">
                                    <strong className="text-slate-800">Correct Answer:</strong> {feedback.correctAnswer}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    <strong className="text-slate-800">Explanation:</strong> {feedback.rubric}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (quizState === 'results') {
        return (
            <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-3xl font-bold text-slate-800">Quiz Complete!</h3>
                <p className="text-lg text-slate-500 mt-2">Your Final Score</p>
                <div className="my-6 text-6xl font-extrabold text-[var(--brand-primary)]">{score} / {history.length}</div>
                <div className="space-y-4 text-left max-h-80 overflow-y-auto pr-2">
                    <h4 className="text-xl font-bold">Review Your Answers</h4>
                    {history.map((item, index) => (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${item.isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'}`}>
                            <p className="font-semibold">Q{index + 1}: {item.question}</p>
                            <p className="text-sm mt-1">Your answer: <span className={!item.isCorrect ? 'text-red-700 font-bold' : ''}>{item.userAnswer}</span></p>
                            {!item.isCorrect && <p className="text-sm mt-1">Correct answer: <span className="text-emerald-700 font-bold">{item.answer}</span></p>}
                        </div>
                    ))}
                </div>
                <button onClick={() => setQuizState('setup')} className="btn btn-primary mt-8">Take Another Quiz</button>
            </div>
        );
    }

    return null;
};

export default AdaptiveQuizGenerator;