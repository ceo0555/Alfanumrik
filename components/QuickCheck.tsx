import React, { useState, useMemo } from 'react';
import { QuickCheck } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon, LightbulbIcon } from '../constants/icons';

interface QuickCheckStepProps {
  content: QuickCheck;
  onCompleted: () => void;
  skillId: string;
  onAnswer: (skillId: string, isCorrect: boolean) => void;
}

const QuickCheckStep: React.FC<QuickCheckStepProps> = ({ content, onCompleted, skillId, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const shuffledOptions = useMemo(() => {
    return [...content.options].sort(() => Math.random() - 0.5);
  }, [content.options]);

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const isCorrect = option === content.correct_answer;
    onAnswer(skillId, isCorrect);
    
    // Call onCompleted immediately after the user answers, regardless of correctness.
    // This allows the user to see the feedback, and the 'Next' button will be enabled.
    onCompleted();
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
    <div className="p-4 border-l-4 border-amber-400 bg-amber-50 rounded-r-lg">
      <h3 className="font-bold text-lg text-amber-800 flex items-center gap-2">
        <LightbulbIcon className="w-6 h-6" />
        Concept Check
      </h3>
      <p className="mt-4 text-slate-800 leading-relaxed font-semibold">
        {content.question}
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shuffledOptions.map(option => (
          <button
            key={option}
            onClick={() => handleSelectOption(option)}
            disabled={isAnswered}
            className={`w-full text-center p-3 rounded-lg border border-slate-200 font-semibold transition-all ${getOptionClasses(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
      
      {isAnswered && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            <div className={`flex items-center gap-2 font-bold`}>
              {isCorrect ? <ThumbsUpIcon className="w-5 h-5"/> : <ThumbsDownIcon className="w-5 h-5" />}
              <span>{isCorrect ? "Correct!" : "Not quite."}</span>
            </div>
            <p className="mt-1">{content.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(QuickCheckStep);