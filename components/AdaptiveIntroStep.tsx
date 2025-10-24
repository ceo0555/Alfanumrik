import React from 'react';
import { AssessmentResult } from '../types';
import { CheckCircleIcon } from '../constants/icons';

interface AdaptiveIntroStepProps {
  assessmentResults: AssessmentResult[];
}

const AdaptiveIntroStep: React.FC<AdaptiveIntroStepProps> = ({ assessmentResults }) => {
  const hasIncorrect = assessmentResults.some(r => !r.is_correct);

  return (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full animate-fade-in">
      {hasIncorrect ? (
        <>
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[var(--brand-primary)] mx-auto"></div>
          <h3 className="mt-4 text-xl font-bold text-slate-700">Analyzing Your Results...</h3>
          <p className="mt-2 text-slate-500">We're creating a personalized practice plan just for you.</p>
        </>
      ) : (
        <>
          <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto" />
          <h3 className="mt-4 text-xl font-bold text-slate-700">Great Job!</h3>
          <p className="mt-2 text-slate-500">You answered all questions correctly. Moving on...</p>
        </>
      )}
    </div>
  );
};

export default AdaptiveIntroStep;
