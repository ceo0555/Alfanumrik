import React from 'react';
import { KeyTermStep as KeyTermStepType } from '../types';
import { BrainCircuitIcon } from '../constants/icons';

interface KeyTermStepProps {
  content: KeyTermStepType['content'];
  handleDeepDiveSnippet: (event: React.MouseEvent, snippet: string) => void;
}

const KeyTermStep: React.FC<KeyTermStepProps> = ({ content, handleDeepDiveSnippet }) => {
  const deepDiveText = `${content.term}: ${content.definition}`;
  return (
    <div className="my-4 p-3 bg-[var(--brand-secondary)] border-l-4 border-[var(--brand-primary)] rounded-r-lg relative group/term">
      <strong className="text-[var(--brand-primary-hover)] font-semibold">{content.term}:</strong>
      <span className="ml-2 text-slate-700">{content.definition}</span>

      <button
          onClick={(e) => handleDeepDiveSnippet(e, deepDiveText)}
          className="absolute top-1/2 -translate-y-1/2 right-2 p-1 text-slate-400 rounded-full hover:bg-slate-200 hover:text-[var(--brand-primary)] opacity-0 group-hover/term:opacity-100 transition-opacity"
          aria-label="Deep dive into this term"
      >
          <BrainCircuitIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default KeyTermStep;