import React, { useState, useMemo } from 'react';
import { MatchingQuizStep as MatchingQuizStepType } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon, SparklesIcon } from '../constants/icons';

interface MatchingQuizStepProps {
  content: MatchingQuizStepType['content'];
  stepAnswer?: { answer: string | null; isCorrect: boolean };
  onStepAnswer: (answer: string | null, isCorrect: boolean) => void;
}

const MatchingQuizStep: React.FC<MatchingQuizStepProps> = ({ content, stepAnswer, onStepAnswer }) => {
  const [isAnswered, setIsAnswered] = useState(false);
  const [droppedDefinitions, setDroppedDefinitions] = useState<{ [termIndex: number]: string | null }>(
    Object.fromEntries(content.pairs.map((_, i) => [i, null]))
  );
  const [feedback, setFeedback] = useState<{ [termIndex: number]: boolean }>({});

  const shuffledDefinitions = useMemo(() => {
    return [...content.pairs.map(p => p.definition)].sort(() => Math.random() - 0.5);
  }, [content.pairs]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, definition: string) => {
    e.dataTransfer.setData("text/plain", definition);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, termIndex: number) => {
    e.preventDefault();
    if (isAnswered) return;
    const definition = e.dataTransfer.getData("text/plain");
    
    // If the definition is already dropped elsewhere, remove it from the old spot
    const newDropped = {...droppedDefinitions};
    for(const key in newDropped) {
        if (newDropped[key] === definition) {
            newDropped[key] = null;
        }
    }
    newDropped[termIndex] = definition;
    setDroppedDefinitions(newDropped);
  };
  
  const checkAnswers = () => {
    if (isAnswered) return;
    const newFeedback: { [termIndex: number]: boolean } = {};
    let allCorrect = true;
    content.pairs.forEach((pair, index) => {
      const isCorrect = droppedDefinitions[index] === pair.definition;
      newFeedback[index] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });
    setFeedback(newFeedback);
    setIsAnswered(true);
    onStepAnswer(JSON.stringify(droppedDefinitions), allCorrect);
  };

  const definitionsInBank = shuffledDefinitions.filter(def => !Object.values(droppedDefinitions).includes(def));
  
  const allDropped = Object.values(droppedDefinitions).every(d => d !== null);

  return (
    <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg">
      <h3 className="font-bold text-lg text-purple-800 flex items-center gap-2">
        <SparklesIcon className="w-6 h-6" /> Match the Terms
      </h3>
      <p className="mt-2 text-sm text-slate-700">{content.instruction}</p>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Terms and Dropzones */}
        <div className="space-y-3">
            {content.pairs.map((pair, index) => {
                const isCorrect = isAnswered && feedback[index];
                const isIncorrect = isAnswered && !feedback[index];
                return (
                    <div key={index} className="flex items-center gap-3">
                        <div className="w-1/2 font-semibold text-slate-800 text-sm">{pair.term}</div>
                        <div
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`w-1/2 p-3 text-xs rounded-lg border-2 border-dashed min-h-[50px] flex items-center justify-center transition-colors
                                ${isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : ''}
                                ${isIncorrect ? 'border-red-500 bg-red-50 text-red-800' : ''}
                                ${!isAnswered ? 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50' : ''}
                            `}
                        >
                            {droppedDefinitions[index] || <span className="text-slate-400">Drop here</span>}
                            {isIncorrect && <span className="font-bold ml-2"> (Correct: "{pair.definition}")</span>}
                        </div>
                    </div>
                )
            })}
        </div>
        {/* Draggable Definitions */}
        <div className="p-3 bg-slate-100 rounded-lg space-y-2">
            {definitionsInBank.map((def, index) => (
                <div
                    key={index}
                    draggable={!isAnswered}
                    onDragStart={(e) => handleDragStart(e, def)}
                    className="p-2 bg-white rounded-md shadow-sm border cursor-grab text-xs text-slate-700"
                >
                    {def}
                </div>
            ))}
            {definitionsInBank.length === 0 && <p className="text-xs text-slate-400 text-center">All definitions placed!</p>}
        </div>
      </div>
      {!isAnswered && (
         <div className="mt-6 text-center">
            <button onClick={checkAnswers} disabled={!allDropped} className="btn btn-primary">Check Answers</button>
        </div>
      )}
    </div>
  );
};

export default React.memo(MatchingQuizStep);