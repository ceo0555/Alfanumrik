import React, { useState } from 'react';
import { QuestionPoolItem } from '../types';

interface QuestionCardProps {
  questionData: QuestionPoolItem;
  questionNumber: number;
  stepAnswer?: { answer: string | null; isCorrect: boolean };
  onStepAnswer: (answer: string | null, isCorrect: boolean) => void;
}

const DifficultyBadge: React.FC<{ difficulty: 'E' | 'M' | 'H' }> = ({ difficulty }) => {
  const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
  const colorClasses = {
    H: 'bg-red-100 text-red-800', // Hard
    M: 'bg-yellow-100 text-yellow-800', // Medium
    E: 'bg-green-100 text-green-800', // Easy
  };
  const text = {
    H: 'High',
    M: 'Medium',
    E: 'Easy'
  };
  return <span className={`${baseClasses} ${colorClasses[difficulty]}`}>{text[difficulty]}</span>;
};

const QuestionCard: React.FC<QuestionCardProps> = ({ questionData, questionNumber, stepAnswer, onStepAnswer }) => {
  const [currentMcqSelection, setCurrentMcqSelection] = useState<string | null>(null);
  const [currentShortAnswer, setCurrentShortAnswer] = useState('');

  const isAnswered = !!stepAnswer;
  const submittedAnswer = stepAnswer?.answer;

  const handleMcqSelect = (option: string) => {
    if (isAnswered) return;
    setCurrentMcqSelection(option);
  };
  
  const checkAnswer = () => {
      if (isAnswered) return;
      
      let isCorrect: boolean;
      let userAnswer: string | null;

      if (questionData.type === 'MCQ') {
          userAnswer = currentMcqSelection;
          isCorrect = userAnswer === questionData.answer;
      } else {
          userAnswer = currentShortAnswer;
          isCorrect = false; 
      }
      
      onStepAnswer(userAnswer, isCorrect);
  };

  const getOptionClasses = (option: string) => {
    const selectedOption = isAnswered ? submittedAnswer : currentMcqSelection;
    if (!isAnswered) {
      return selectedOption === option
        ? 'ring-2 ring-indigo-500 bg-indigo-50'
        : 'hover:bg-slate-100';
    }
    if (option === questionData.answer) {
      return 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500';
    }
    if (option === selectedOption && option !== questionData.answer) {
      return 'bg-red-100 text-red-800 ring-2 ring-red-500';
    }
    return 'bg-slate-50';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6 last:mb-0">
      <div className="flex justify-between items-start mb-4">
        <p className="text-lg font-semibold text-slate-800">
          <span className="text-indigo-600 mr-2">Q{questionNumber}.</span>{questionData.question}
        </p>
        <div className="flex-shrink-0 ml-4 space-x-2 flex items-center">
            {questionData.tags?.map(tag => (
              <span key={tag} className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 uppercase tracking-wider">{tag}</span>
            ))}
            <DifficultyBadge difficulty={questionData.difficulty} />
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{questionData.bloom}</span>
        </div>
      </div>

      {questionData.type === 'MCQ' && questionData.options && (
        <div className="space-y-3">
          {questionData.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleMcqSelect(option)}
              disabled={isAnswered}
              className={`w-full text-left p-3 rounded-lg border border-slate-200 transition-all ${getOptionClasses(option)}`}
            >
              <span className="font-mono mr-3 text-indigo-600">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          ))}
        </div>
      )}
      
      {questionData.type !== 'MCQ' && (
        <textarea
            className="form-textarea w-full p-3 rounded-lg"
            rows={4}
            placeholder="Type your answer here..."
            value={isAnswered ? (submittedAnswer || '') : currentShortAnswer}
            onChange={(e) => setCurrentShortAnswer(e.target.value)}
            readOnly={isAnswered}
        />
      )}

      {!isAnswered && (
        <div className="mt-4 text-right">
          <button
            onClick={checkAnswer}
            disabled={questionData.type === 'MCQ' ? !currentMcqSelection : !currentShortAnswer.trim()}
            className="btn btn-primary"
          >
            Check Answer
          </button>
        </div>
      )}

      {isAnswered && (
        <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <h4 className="font-bold text-emerald-800">Correct Answer & Rubric</h4>
          <p className="mt-1 font-semibold text-slate-700">{questionData.answer}</p>
          <p className="mt-2 text-sm text-slate-600">{questionData.rubric}</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(QuestionCard);
