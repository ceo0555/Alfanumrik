import React from 'react';
import { HOTSStep as HOTSStepType } from '../types';
import { cleanText } from '../utils/textHelpers';
import { LightbulbIcon } from '../constants/icons';

interface HOTSStepProps {
  content: HOTSStepType['content'];
  onCompleted: () => void;
}

const HOTSStep: React.FC<HOTSStepProps> = ({ content, onCompleted }) => {
  return (
    <div className="p-4 border-l-4 border-[var(--brand-primary)] bg-[var(--brand-secondary)] rounded-r-lg">
      <h3 className="font-bold text-lg text-[var(--brand-primary-hover)] flex items-center gap-2">
        <LightbulbIcon className="w-6 h-6" /> Higher-Order Thinking Question
      </h3>
      <p className="mt-3 font-semibold text-slate-800">{cleanText(content.question)}</p>
      <details className="mt-2" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) onCompleted(); }}>
        <summary className="cursor-pointer font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]">
          Show Exemplar Answer
        </summary>
        <p className="mt-2 p-3 bg-white rounded border border-blue-200 whitespace-pre-wrap">{cleanText(content.exemplar_answer)}</p>
      </details>
    </div>
  );
};

export default HOTSStep;
