import React from 'react';
import { GuidedPracticeStep, IndependentPracticeStep } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface PracticeStepProps {
  content: GuidedPracticeStep['content'] | IndependentPracticeStep['content'];
  type: 'guided_practice' | 'independent_practice';
  onCompleted: () => void;
}

const PracticeStep: React.FC<PracticeStepProps> = ({ content, type, onCompleted }) => {
  const isGuided = type === 'guided_practice';
  const themeClasses = isGuided
    ? { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800', hover: 'hover:text-yellow-900', hintBorder: 'border-yellow-200' }
    : { border: 'border-sky-400', bg: 'bg-sky-50', text: 'text-sky-800', hover: 'hover:text-sky-900', hintBorder: 'border-sky-200' };

  return (
    <div className={`p-4 border-l-4 ${themeClasses.border} ${themeClasses.bg} rounded-r-lg prose prose-sm max-w-none`}>
      <div className="font-bold flex gap-2">Question: <MarkdownRenderer content={content.question} /></div>
      
      {isGuided && 'hint' in content && (
        <details className="mt-2" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) onCompleted(); }}>
          <summary className={`cursor-pointer font-semibold not-prose ${themeClasses.text} ${themeClasses.hover}`}>
            Stuck? Click for a hint.
          </summary>
          <div className={`mt-1 p-2 bg-white rounded border ${themeClasses.hintBorder}`}><MarkdownRenderer content={content.hint} /></div>
        </details>
      )}

      <details className="mt-2" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) onCompleted(); }}>
        <summary className={`cursor-pointer font-semibold not-prose ${themeClasses.text} ${themeClasses.hover}`}>
          Check the solution.
        </summary>
        <div className="mt-1 p-2 bg-white rounded border whitespace-pre-wrap">
          <MarkdownRenderer content={isGuided && 'stepwise_solution' in content ? content.stepwise_solution : 'answer_key' in content ? content.answer_key : ''} />
        </div>
      </details>
    </div>
  );
};

export default PracticeStep;
