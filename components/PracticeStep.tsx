import React, { useState } from 'react';
import { GuidedPracticeStep, IndependentPracticeStep } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface PracticeStepProps {
  content: GuidedPracticeStep['content'] | IndependentPracticeStep['content'];
  type: 'guided_practice' | 'independent_practice';
  onCompleted: () => void;
}

const PracticeStep: React.FC<PracticeStepProps> = ({ content, type, onCompleted }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const isGuided = type === 'guided_practice';
  const themeClasses = isGuided
    ? { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800', hover: 'hover:text-yellow-900', hintBorder: 'border-yellow-200' }
    : { border: 'border-sky-400', bg: 'bg-sky-50', text: 'text-sky-800', hover: 'hover:text-sky-900', hintBorder: 'border-sky-200' };

  return (
    <div className={`p-4 border-l-4 ${themeClasses.border} ${themeClasses.bg} rounded-r-lg prose prose-sm max-w-none`}>
      <div className="font-bold flex gap-2">Question: <MarkdownRenderer content={content.question} /></div>
      
      {isGuided && 'hint' in content && (
        <details className="mt-2">
          <summary className={`cursor-pointer font-semibold not-prose ${themeClasses.text} ${themeClasses.hover}`}>
            Stuck? Click for a hint.
          </summary>
          <div className={`mt-1 p-2 bg-white rounded border ${themeClasses.hintBorder}`}><MarkdownRenderer content={content.hint} /></div>
        </details>
      )}

      <textarea
        className="form-textarea w-full p-3 rounded-lg mt-3 text-sm"
        rows={3}
        placeholder="Try solving it here first..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
      />

      <details className="mt-2" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) onCompleted(); }}>
        <summary className={`cursor-pointer font-semibold not-prose ${themeClasses.text} ${themeClasses.hover}`}>
          Check the solution.
        </summary>
        <div className="mt-1 p-3 bg-white rounded border space-y-3">
            <div>
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Your Answer</h4>
                <div className="p-2 bg-slate-50 rounded mt-1 whitespace-pre-wrap text-slate-700">
                    {userAnswer.trim() ? <MarkdownRenderer content={userAnswer} /> : <span className="text-slate-400 italic">No answer provided</span>}
                </div>
            </div>
             <div className="pt-3 border-t">
                <h4 className="font-bold text-xs text-emerald-700 uppercase tracking-wider">Correct Solution</h4>
                <div className="p-2 whitespace-pre-wrap">
                  <MarkdownRenderer content={isGuided && 'stepwise_solution' in content ? content.stepwise_solution : 'answer_key' in content ? content.answer_key : ''} />
                </div>
             </div>
        </div>
      </details>
    </div>
  );
};

export default PracticeStep;