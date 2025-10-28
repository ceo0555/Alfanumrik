import React from 'react';
import { AdaptiveFollowUpStep as AdaptiveFollowUpStepType } from '../types';
import { TargetIcon } from '../constants/icons';
import MarkdownRenderer from './MarkdownRenderer';

interface AdaptiveFollowUpStepProps {
  content: AdaptiveFollowUpStepType['content'];
}

const AdaptiveFollowUpStep: React.FC<AdaptiveFollowUpStepProps> = ({ content: item }) => {
  return (
    <div className="p-4 bg-[var(--brand-secondary)] border-l-4 border-[var(--brand-primary)] rounded-r-lg animate-fade-in prose prose-sm max-w-none">
      <h3 className="font-bold text-lg text-[var(--brand-primary-hover)] flex items-center gap-2 not-prose">
        <TargetIcon /> Concept to Review: {item.concept}
      </h3>
      <div className="text-slate-700"><MarkdownRenderer content={item.explanation} /></div>
      <div className="mt-4 p-3 bg-white rounded-md border border-blue-200 not-prose">
        <p className="font-semibold text-slate-800">New Practice Question:</p>
        <div className="mt-1 text-slate-700"><MarkdownRenderer content={item.practice_question.question} /></div>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer font-semibold text-[var(--brand-primary)]">Show Answer</summary>
          <div className="mt-1 text-slate-600"><MarkdownRenderer content={item.practice_question.answer_key} /></div>
        </details>
      </div>
      <p className="mt-3 text-sm text-slate-500 font-medium not-prose">Suggestion: <MarkdownRenderer content={item.review_suggestion} /></p>
    </div>
  );
};

export default AdaptiveFollowUpStep;
