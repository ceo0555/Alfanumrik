import React from 'react';
import { CommonErrorStep as CommonErrorStepType } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface CommonErrorStepProps {
  content: CommonErrorStepType['content'];
}

const CommonErrorStep: React.FC<CommonErrorStepProps> = ({ content }) => {
  return (
    <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg prose prose-sm max-w-none">
      <h3 className="font-bold text-lg text-red-800 not-prose">Common Mistake to Avoid</h3>
      <div className="mt-3">
        <p className="font-semibold text-slate-800 !my-0">The Mistake:</p>
        <div className="p-2 bg-red-100/50 rounded text-slate-700"><MarkdownRenderer content={content.error} /></div>
      </div>
      <div className="mt-3">
        <p className="font-semibold text-slate-800 !my-0">The Correction:</p>
        <div className="p-2 bg-emerald-100/50 rounded text-slate-700"><MarkdownRenderer content={content.fix} /></div>
      </div>
    </div>
  );
};

export default CommonErrorStep;
