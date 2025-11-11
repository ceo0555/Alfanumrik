import React from 'react';
import { HOTSStep as HOTSStepType } from '../types';
import { LightbulbIcon } from '../constants/icons';
import MarkdownRenderer from './MarkdownRenderer';

interface HOTSStepProps {
  content: HOTSStepType['content'];
}

const HOTSStep: React.FC<HOTSStepProps> = ({ content }) => {
  return (
    <div className="p-4 border-l-4 border-[var(--brand-primary)] bg-[var(--brand-secondary)] rounded-r-lg prose prose-sm max-w-none">
      <h3 className="font-bold text-lg text-[var(--brand-primary-hover)] flex items-center gap-2 not-prose">
        <LightbulbIcon className="w-6 h-6" /> Higher-Order Thinking Question
      </h3>
      <div className="mt-3 font-semibold text-slate-800"><MarkdownRenderer content={content.question} /></div>
      <details className="mt-2">
        <summary className="cursor-pointer font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] not-prose">
          Show Exemplar Answer
        </summary>
        <div className="mt-2 p-3 bg-white rounded border border-blue-200 whitespace-pre-wrap">
            <MarkdownRenderer content={content.exemplar_answer} />
        </div>
      </details>
    </div>
  );
};

export default HOTSStep;