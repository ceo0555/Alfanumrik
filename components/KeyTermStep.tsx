import React from 'react';
import { KeyTermStep as KeyTermStepType } from '../types';

interface KeyTermStepProps {
  content: KeyTermStepType['content'];
}

const KeyTermStep: React.FC<KeyTermStepProps> = ({ content }) => {
  return (
    <div className="my-4 p-3 bg-[var(--brand-secondary)] border-l-4 border-[var(--brand-primary)] rounded-r-lg">
      <strong className="text-[var(--brand-primary-hover)] font-semibold">{content.term}:</strong>
      <span className="ml-2 text-slate-700">{content.definition}</span>
    </div>
  );
};

export default KeyTermStep;
