import React from 'react';
import { WorkedExampleStep as WorkedExampleStepType } from '../types';
import { cleanText } from '../utils/textHelpers';

interface WorkedExampleStepProps {
  content: WorkedExampleStepType['content'];
}

const WorkedExampleStep: React.FC<WorkedExampleStepProps> = ({ content: ex }) => {
  return (
    <div className="p-4 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-lg prose max-w-none">
      <h3 className="font-semibold text-slate-800">Prompt:</h3>
      <p className="mb-2">{cleanText(ex.prompt)}</p>
      <h3 className="font-semibold text-slate-800">Solution:</h3>
      <p className="mb-2 whitespace-pre-wrap font-mono text-sm bg-slate-100 p-3 rounded">{ex.solution}</p>
      <h3 className="font-semibold text-slate-800">Why it works:</h3>
      <p>{cleanText(ex.why_it_works)}</p>
    </div>
  );
};

export default WorkedExampleStep;
