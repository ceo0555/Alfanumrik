import React, { useState, useRef } from 'react';
import { QuestionPoolItem, ScratchpadState } from '../types';
import { ThumbsDownIcon, ThumbsUpIcon, SparklesIcon, NotebookIcon } from '../constants/icons';
import { gradeShortAnswer, analyzeScratchpadForErrorAnalysis } from '../services/geminiService';
import DigitalScratchpad from './DigitalScratchpad';

interface QuestionCardProps {
  questionData: QuestionPoolItem;
  questionNumber: number;
  stepAnswer?: { answer: string | null; isCorrect: boolean };
  onStepAnswer: (answer: string | null, isCorrect: boolean, errorType?: string) => void;
  isGeneratingRemediation?: boolean;
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

const QuestionCard: React.FC<QuestionCardProps> = ({ questionData, questionNumber, stepAnswer, onStepAnswer, isGeneratingRemediation }) => {
  const [currentMcqSelection, setCurrentMcqSelection] = useState<string | null>(null);
  const [currentShortAnswer, setCurrentShortAnswer] = useState('');
  const [isAiGrading, setIsAiGrading] = useState(false);
  
  // Digital Scratchpad State
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadState, setScratchpadState] = useState<ScratchpadState>({ paths: [] });
  const scratchpadRef = useRef<{ getCanvasDataURL: () => string | null }>(null);

  const isAnswered = !!stepAnswer;
  const submittedAnswer = stepAnswer?.answer;

  const handleMcqSelect = (option: string) => {
    if (isAnswered) return;
    setCurrentMcqSelection(option);
  };
  
  const checkAnswer = async () => {
      if (isAnswered) return;
      
      let isCorrect: boolean;
      let userAnswer: string | null;
      let errorType: string | undefined = undefined;

      if (questionData.type === 'MCQ') {
          userAnswer = currentMcqSelection;
          isCorrect = userAnswer === questionData.answer;
          onStepAnswer(userAnswer, isCorrect);
      } else { // Handles 'SA', 'LA', etc. with AI grading
          userAnswer = currentShortAnswer;
          setIsAiGrading(true);
          try {
            const result = await gradeShortAnswer(questionData.question, questionData.rubric, questionData.marks, userAnswer);
            isCorrect = result.awardedMarks === questionData.marks;

            // NEW: If incorrect, analyze scratchpad for error type
            if (!isCorrect) {
                const imageData = scratchpadRef.current?.getCanvasDataURL();
                if (imageData) {
                    errorType = await analyzeScratchpadForErrorAnalysis(imageData, questionData.question);
                }
            }
          } catch (e) {
            console.error("AI grading failed, falling back to simple check.", e);
            isCorrect = userAnswer.trim().toLowerCase() === questionData.answer.trim().toLowerCase();
          } finally {
            setIsAiGrading(false);
            onStepAnswer(userAnswer, isCorrect, errorType);
          }
      }
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
  
  const showScratchpad = questionData.type !== 'MCQ'; // Only for non-MCQ for now

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6 last:mb-0">
        <div className="flex justify-between items-start mb-4">
          <p className="text-lg font-semibold text-slate-800">
            <span className="text-indigo-600 mr-2">Q{questionNumber}.</span>{questionData.question}
          </p>
          <div className="flex-shrink-0 ml-4 space-x-2 flex items-center">
              {showScratchpad && (
                  <button onClick={() => setIsScratchpadOpen(true)} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50">
                      <NotebookIcon className="w-5 h-5" />
                      Rough Work
                  </button>
              )}
              <DifficultyBadge difficulty={questionData.difficulty} />
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
              disabled={isAiGrading || (questionData.type === 'MCQ' ? !currentMcqSelection : !currentShortAnswer.trim())}
              className="btn btn-primary min-w-[150px]"
            >
              {isAiGrading ? (
                <span className="flex items-center justify-center gap-2"><SparklesIcon className="w-5 h-5 animate-spin" /> Grading...</span>
              ) : (
                'Check Answer'
              )}
            </button>
          </div>
        )}

        {isAnswered && (
          <div className="mt-4 space-y-3">
              {stepAnswer?.isCorrect ? (
                  <div className="p-3 rounded-lg bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-2">
                      <ThumbsUpIcon className="w-5 h-5"/> Correct!
                  </div>
              ) : (
                  <div className="p-3 rounded-lg bg-red-100 text-red-800 font-semibold flex items-center gap-2">
                      <ThumbsDownIcon className="w-5 h-5"/> Incorrect
                  </div>
              )}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-800">Correct Answer & Rubric</h4>
                  <p className="mt-1 font-semibold text-slate-700">{questionData.answer}</p>
                  <p className="mt-2 text-sm text-slate-600">{questionData.rubric}</p>
              </div>
          </div>
        )}
        {isAnswered && !stepAnswer?.isCorrect && isGeneratingRemediation && (
          <div className="mt-2 text-sm text-indigo-600 font-semibold animate-pulse">
              Generating a quick review to help with this concept...
          </div>
        )}
      </div>

      {showScratchpad && (
          <DigitalScratchpad 
            ref={scratchpadRef}
            isOpen={isScratchpadOpen}
            onClose={() => setIsScratchpadOpen(false)}
            initialState={scratchpadState}
            onSave={setScratchpadState}
            questionText={questionData.question}
          />
      )}
    </>
  );
};

export default React.memo(QuestionCard);