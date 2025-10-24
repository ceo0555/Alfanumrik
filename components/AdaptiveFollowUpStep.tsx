import React from 'react';
import { AdaptiveFollowUpStep as AdaptiveFollowUpStepType } from '../types';
import { cleanText } from '../utils/textHelpers';
import { TargetIcon } from '../constants/icons';

interface AdaptiveFollowUpStepProps {
  content: AdaptiveFollowUpStepType['content'];
}

const AdaptiveFollowUpStep: React.FC<AdaptiveFollowUpStepProps> = ({ content: item }) => {
  return (
    <div className="p-4 bg-[var(--brand-secondary)] border-l-4 border-[var(--brand-primary)] rounded-r-lg animate-fade-in">
      <h3 className="font-bold text-lg text-[var(--brand-primary-hover)] flex items-center gap-2">
        <TargetIcon /> Concept to Review: {item.concept}
      </h3>
      <p className="mt-2 text-slate-700">{cleanText(item.explanation)}</p>
      <div className="mt-4 p-3 bg-white rounded-md border border-blue-200">
        <p className="font-semibold text-slate-800">New Practice Question:</p>
        <p className="mt-1 text-slate-700">{cleanText(item.practice_question.question)}</p>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer font-semibold text-[var(--brand-primary)]">Show Answer</summary>
          <p className="mt-1 text-slate-600">{cleanText(item.practice_question.answer_key)}</p>
        </details>
      </div>
      <p className="mt-3 text-sm text-slate-500 font-medium">Suggestion: {cleanText(item.review_suggestion)}</p>
    </div>
  );
};

export default AdaptiveFollowUpStep;
