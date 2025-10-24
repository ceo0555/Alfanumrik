import React from 'react';
import { AssessmentIntroStep as AssessmentIntroStepType } from '../types';
import { ClipboardCheckIcon } from '../constants/icons';

interface AssessmentIntroStepProps {
  content: AssessmentIntroStepType['content'];
}

const AssessmentIntroStep: React.FC<AssessmentIntroStepProps> = ({ content }) => {
  return (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full">
      <ClipboardCheckIcon className="w-16 h-16 text-[var(--brand-primary)] mb-4" />
      <h2 className="text-2xl font-bold text-slate-800">Test Your Knowledge</h2>
      <p className="mt-2 text-slate-500 max-w-md">{content}</p>
    </div>
  );
};

export default AssessmentIntroStep;
