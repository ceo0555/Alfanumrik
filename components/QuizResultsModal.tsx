import React from 'react';
import { Assignment, StudentSubmission } from '../types';
import { XIcon, CheckCircleIcon, ThumbsUpIcon, ThumbsDownIcon } from '../constants/icons';

interface QuizResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submission: StudentSubmission;
}

const QuizResultsModal: React.FC<QuizResultsModalProps> = ({ isOpen, onClose, assignment, submission }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold">Quiz Results: {assignment.title}</h3>
          <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
        </div>
        
        <div className="text-center mb-4 p-4 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-600">Your Score</p>
            <p className="text-5xl font-extrabold text-[var(--brand-primary)]">
                {submission.score} / {assignment.quizQuestions?.length}
            </p>
        </div>

        <div className="flex-grow overflow-y-auto max-h-[50vh] pr-2 space-y-4">
            {assignment.quizQuestions?.map((q, index) => {
                const studentAnswer = submission.answers.find(a => a.q_id === q.q_id);
                if (!studentAnswer) return null;

                return (
                    <div key={q.q_id} className={`p-4 rounded-lg border-l-4 ${studentAnswer.isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-red-50 border-red-400'}`}>
                        <p className="font-semibold">{index + 1}. {q.question}</p>
                        
                        <div className="mt-2 text-sm">
                            <p>Your answer: <span className={`font-semibold ${!studentAnswer.isCorrect ? 'text-red-700' : ''}`}>{studentAnswer.answer}</span></p>
                            {!studentAnswer.isCorrect && <p className="mt-1">Correct answer: <span className="font-semibold text-emerald-700">{q.answer}</span></p>}
                        </div>

                        {studentAnswer.feedback && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                                <p className="text-xs font-bold text-slate-500">Teacher's Feedback:</p>
                                <p className="text-sm text-slate-600">{studentAnswer.feedback}</p>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>

        <div className="mt-4 flex-shrink-0">
          <button onClick={onClose} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">Close</button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsModal;
