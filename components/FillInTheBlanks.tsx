import React, { useMemo } from 'react';
import { FillInTheBlanks as FillInTheBlanksType } from '../types';
import { cleanText } from '../utils/textHelpers';
import { ThumbsUpIcon, ThumbsDownIcon } from '../constants/icons';

interface FillInTheBlanksStepProps {
  content: FillInTheBlanksType;
  stepAnswer?: { answer: string | null; isCorrect: boolean };
  onStepAnswer: (answer: string | null, isCorrect: boolean) => void;
}

const FillInTheBlanksStep: React.FC<FillInTheBlanksStepProps> = ({ content, stepAnswer, onStepAnswer }) => {
  const isAnswered = !!stepAnswer;
  const selectedOption = stepAnswer?.answer;

  const shuffledOptions = useMemo(() => {
    return [...content.options].sort(() => Math.random() - 0.5);
  }, [content.options]);

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    
    const isCorrect = option === content.correct_answer;
    onStepAnswer(option, isCorrect);
  };

  const getOptionClasses = (option: string) => {
    if (!isAnswered) {
      return 'bg-white hover:bg-slate-100';
    }
    if (option === content.correct_answer) {
      return 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500';
    }
    if (option === selectedOption && option !== content.correct_answer) {
      return 'bg-red-100 text-red-800 ring-2 ring-red-500';
    }
    return 'bg-slate-100 text-slate-500 cursor-not-allowed';
  };
  
  const isCorrect = selectedOption === content.correct_answer;

  return (
    <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
      <h3 className="font-bold text-lg text-blue-800">Check Your Knowledge</h3>
      <p className="mt-4 text-lg text-slate-800 leading-relaxed">
        {cleanText(content.sentence_parts[0])}
        <span className="inline-block bg-slate-200 rounded-md px-4 py-1 mx-2 text-slate-500 min-w-[100px] text-center">
            {isAnswered ? selectedOption : '...'}
        </span>
        {content.sentence_parts[1] && cleanText(content.sentence_parts[1])}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {shuffledOptions.map(option => (
          <button
            key={option}
            onClick={() => handleSelectOption(option)}
            disabled={isAnswered}
            className={`w-full text-center p-3 rounded-lg border border-slate-200 font-semibold transition-all ${getOptionClasses(option)}`}
          >
            {cleanText(option)}
          </button>
        ))}
      </div>
      
      {isAnswered && (
        <div className={`mt-4 flex items-center gap-2 font-semibold ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
          {isCorrect ? <ThumbsUpIcon className="w-5 h-5"/> : <ThumbsDownIcon className="w-5 h-5" />}
          <span>{isCorrect ? "That's right!" : `Not quite. The correct answer is "${content.correct_answer}".`}</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(FillInTheBlanksStep);
