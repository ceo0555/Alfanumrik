import React, { useState } from 'react';
import { Assignment, QuestionPoolItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, ArrowRightIcon } from '../constants/icons';

interface QuizTakerProps {
  assignment: Assignment;
  onFinishQuiz: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ assignment, onFinishQuiz }) => {
  const { activeProfile, handleSaveSubmission } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [q_id: string]: string }>({});
  
  if (!assignment.quizQuestions) {
    onFinishQuiz();
    return null;
  }
  
  const questions = assignment.quizQuestions;
  const currentQuestion = questions[currentQuestionIndex];

  const handleSetAnswer = (q_id: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [q_id]: answer }));
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!activeProfile) return;

    const formattedAnswers = questions.map(q => ({
        q_id: q.q_id,
        answer: answers[q.q_id] || ''
    }));

    handleSaveSubmission({
        assignmentId: assignment.id,
        studentId: activeProfile.id,
        answers: formattedAnswers,
        status: 'submitted',
    });
    onFinishQuiz();
  };
  
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  return (
    <div className="max-w-3xl mx-auto animate-slide-in-up">
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-slate-700">{assignment.title}</h2>
            <span className="text-sm font-semibold text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-[var(--brand-primary)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-lg border border-[var(--border-color)] mb-6 min-h-[300px]">
            <p className="text-lg font-semibold text-slate-800 mb-4">{currentQuestion.question}</p>
            {currentQuestion.type === 'MCQ' && currentQuestion.options && (
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleSetAnswer(currentQuestion.q_id, option)}
                            className={`w-full text-left p-3 rounded-lg border border-slate-200 transition-all ${
                                answers[currentQuestion.q_id] === option ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:bg-slate-100'
                            }`}
                        >
                            <span className="font-mono mr-3 text-indigo-600">{String.fromCharCode(65 + index)}.</span>
                            {option}
                        </button>
                    ))}
                </div>
            )}
            {currentQuestion.type === 'SA' && (
                <textarea
                    value={answers[currentQuestion.q_id] || ''}
                    onChange={(e) => handleSetAnswer(currentQuestion.q_id, e.target.value)}
                    className="form-textarea w-full"
                    rows={5}
                    placeholder="Type your answer here..."
                />
            )}
        </div>

        <div className="flex justify-between items-center">
            <button onClick={goToPrev} disabled={currentQuestionIndex === 0} className="btn flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50">
                <ArrowLeftIcon className="w-5 h-5" /> Previous
            </button>
            {currentQuestionIndex === questions.length - 1 ? (
                <button onClick={handleSubmitQuiz} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">
                    Submit Quiz
                </button>
            ) : (
                <button onClick={goToNext} className="btn btn-primary flex items-center gap-2">
                    Next <ArrowRightIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    </div>
  );
};

export default QuizTaker;