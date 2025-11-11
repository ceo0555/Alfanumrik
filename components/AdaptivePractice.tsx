import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentData } from '../contexts/StudentDataContext';
import { QuizState, QuestionPoolItem, DktSkillState } from '../types';
import { curriculum } from '../constants/curriculum';
import { generateAdaptiveQuestion } from '../services/geminiService';
import { SparklesIcon, ThumbsUpIcon, ThumbsDownIcon } from '../constants/icons';
import Loader from './Loader';

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

const AdaptivePractice: React.FC = () => {
    const { activeProfile } = useAuth();
    const { userDktData, recordAnswer } = useStudentData();

    const [quizState, setQuizState] = useState<QuizState>('setup');
    
    const subjects = useMemo(() => {
        if (!activeProfile) return [];
        return Object.keys(curriculum[activeProfile.grade as keyof typeof curriculum] || {});
    }, [activeProfile]);
    const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');

    const [weakestChapter, setWeakestChapter] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionPoolItem | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [nextDifficulty, setNextDifficulty] = useState<'E' | 'M' | 'H'>('M');
    const [history, setHistory] = useState<(QuestionPoolItem & { userAnswer: string; isCorrect: boolean; })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [shortAnswerText, setShortAnswerText] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean, correctAnswer: string, rubric: string } | null>(null);

    const findWeakestChapter = (subject: string): string | null => {
        if (!activeProfile || !userDktData) return null;
        const subjectSkills = Object.entries(userDktData)
            .filter(([skillId]) => skillId.startsWith(`G${activeProfile.grade}-${subject}`))
            .sort(([, a], [, b]) => (a as DktSkillState).mastery - (b as DktSkillState).mastery);
        
        if (subjectSkills.length > 0) {
            const weakestSkillId = subjectSkills[0][0];
            return weakestSkillId.split('-').slice(2).join('-');
        }
        return curriculum[activeProfile.grade as keyof typeof curriculum]?.[subject]?.[0] || null;
    };

    const fetchNextQuestion = async (difficulty: 'E' | 'M' | 'H', chapter: string) => {
        if (!activeProfile) return;
        setIsLoading(true);
        setError('');
        setCurrentQuestion(null);
        try {
            const previousQuestions = history.map(h => h.question);
            const question = await generateAdaptiveQuestion(activeProfile.grade, selectedSubject, chapter, difficulty, previousQuestions);
            setCurrentQuestion(question);
            setQuestionNumber(prev => prev + 1);
        } catch (err) {
            console.error(err);
            setError('Failed to generate the next question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startQuiz = () => {
        const chapter = findWeakestChapter(selectedSubject);
        if (!chapter) {
            setError(`Could not find any chapters for ${selectedSubject}.`);
            return;
        }
        setWeakestChapter(chapter);
        setQuizState('active');
        setQuestionNumber(0);
        setHistory([]);
        setNextDifficulty('M');
        fetchNextQuestion('M', chapter);
    };

    const handleSubmitAnswer = () => {
        if (!currentQuestion || isAnswered || !activeProfile || !weakestChapter) return;

        let isCorrect = false;
        let userAnswer = '';
        const skillId = `G${activeProfile.grade}-${selectedSubject}-${weakestChapter}`;

        if (currentQuestion.type === 'MCQ') {
            userAnswer = selectedOption || '';
            isCorrect = userAnswer === currentQuestion.answer;
        } else if (currentQuestion.type === 'SA') {
            userAnswer = shortAnswerText;
            isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
        }

        recordAnswer(skillId, isCorrect);
        
        setIsAnswered(true);
        setFeedback({ isCorrect, correctAnswer: currentQuestion.answer, rubric: currentQuestion.rubric });
        setHistory(prev => [...prev, { ...currentQuestion, userAnswer, isCorrect }]);

        let newNextDifficulty: 'E' | 'M' | 'H' = nextDifficulty;
        if (isCorrect) {
            if (nextDifficulty === 'E') newNextDifficulty = 'M';
            else if (nextDifficulty === 'M') newNextDifficulty = 'H';
        } else {
            if (nextDifficulty === 'H') newNextDifficulty = 'M';
            else if (nextDifficulty === 'M') newNextDifficulty = 'E';
        }
        setNextDifficulty(newNextDifficulty);
    };
    
    const handleNext = () => {
        setIsAnswered(false);
        setSelectedOption(null);
        setShortAnswerText('');
        setFeedback(null);
        if (questionNumber >= 10) {
            setQuizState('results');
        } else {
            fetchNextQuestion(nextDifficulty, weakestChapter!);
        }
    };

    const resetQuiz = () => {
        setQuizState('setup');
        setWeakestChapter(null);
        setQuestionNumber(0);
        setHistory([]);
    };

    const getOptionClasses = (option: string) => {
        if (!isAnswered) {
          return selectedOption === option ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:bg-slate-100';
        }
        if (option === currentQuestion?.answer) {
          return 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 cursor-not-allowed';
        }
        if (option === selectedOption && option !== currentQuestion?.answer) {
          return 'bg-red-100 text-red-800 ring-2 ring-red-500 cursor-not-allowed';
        }
        return 'bg-slate-50 cursor-not-allowed text-slate-500';
    };

    const score = history.filter(h => h.isCorrect).length;

    if (quizState === 'setup') {
        return (
            <div className="text-center max-w-lg mx-auto">
                <SparklesIcon className="w-16 h-16 mx-auto text-indigo-500 bg-indigo-50 p-3 rounded-full"/>
                <h3 className="text-xl font-bold text-slate-800 mt-4">AI Adaptive Practice</h3>
                <p className="text-slate-500 mb-6 mt-2">MIGA will identify your weakest chapter in a subject and create a 10-question adaptive quiz to help you improve.</p>
                <div className="space-y-4 text-left">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Select Subject</label>
                        <select id="subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="form-select mt-1 block w-full">
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={startQuiz} disabled={!selectedSubject} className="btn btn-primary mt-6 w-full">Start AI Practice Session</button>
            </div>
        );
    }

    if (quizState === 'active') {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">AI Practice: {selectedSubject}</h3>
                    <p className="text-sm text-slate-500">Focusing on your weakest chapter: <strong>{weakestChapter}</strong></p>
                    <p className="font-semibold">Score: {score} / {history.length} <span className="mx-2">|</span> Question: {questionNumber} / 10</p>
                </div>
                {isLoading && <div className="text-center p-8"><Loader /></div>}
                {error && <p className="p-4 bg-red-50 text-red-700 rounded-lg text-center">{error}</p>}
                {!isLoading && !error && currentQuestion && (
                    <div className="bg-white p-6 rounded-lg border">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-lg font-semibold text-slate-800">{currentQuestion.question}</p>
                            <DifficultyBadge difficulty={currentQuestion.difficulty}/>
                        </div>
                        {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => (
                                    <button key={index} onClick={() => setSelectedOption(option)} disabled={isAnswered} className={`w-full text-left p-3 rounded-lg border border-slate-200 transition-all ${getOptionClasses(option)}`}>
                                        <span className="font-mono mr-3 text-indigo-600">{String.fromCharCode(65 + index)}.</span> {option}
                                    </button>
                                ))}
                            </div>
                        )}
                        {currentQuestion.type === 'SA' && (
                            <textarea value={shortAnswerText} onChange={e => setShortAnswerText(e.target.value)} disabled={isAnswered} className="form-textarea w-full" rows={4} placeholder="Type your answer..."/>
                        )}
                        <div className="mt-6 text-right">
                            {isAnswered ? (
                                <button onClick={handleNext} className="btn btn-primary">{questionNumber >= 10 ? 'Show Results' : 'Next Question'}</button>
                            ) : (
                                <button onClick={handleSubmitAnswer} disabled={!selectedOption && !shortAnswerText.trim()} className="btn btn-primary">Submit</button>
                            )}
                        </div>
                        {isAnswered && feedback && (
                            <div className={`mt-4 p-4 rounded-lg border ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                <h4 className={`font-bold flex items-center gap-2 ${feedback.isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>{feedback.isCorrect ? <ThumbsUpIcon/> : <ThumbsDownIcon/>} {feedback.isCorrect ? 'Correct!' : 'Incorrect'}</h4>
                                {!feedback.isCorrect && <p className="mt-2 text-sm text-slate-600"><strong>Correct Answer:</strong> {feedback.correctAnswer}</p>}
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
                <h3 className="text-3xl font-bold text-slate-800">Practice Complete!</h3>
                <p className="text-lg text-slate-500 mt-2">Final Score</p>
                <div className="my-6 text-6xl font-extrabold text-indigo-600">{score} / {history.length}</div>
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
                <button onClick={resetQuiz} className="btn btn-primary mt-8">Start a New Session</button>
            </div>
        );
    }
    return null;
};

export default AdaptivePractice;
