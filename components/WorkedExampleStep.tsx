import React from 'react';
import { WorkedExampleStep as WorkedExampleStepType } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface WorkedExampleStepProps {
  content: WorkedExampleStepType['content'];
}

const WorkedExampleStep: React.FC<WorkedExampleStepProps> = ({ content: ex }) => {
  return (
    <div className="p-4 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-lg prose prose-sm max-w-none">
      <h3 className="font-semibold text-slate-800 !my-0">Prompt:</h3>
      <MarkdownRenderer content={ex.prompt} />
      <h3 className="font-semibold text-slate-800 !my-0">Solution:</h3>
      <p className="mb-2 whitespace-pre-wrap font-mono text-sm bg-slate-100 p-3 rounded">{ex.solution}</p>
      <h3 className="font-semibold text-slate-800 !my-0">Why it works:</h3>
      <MarkdownRenderer content={ex.why_it_works} />
    </div>
  );
};

export default WorkedExampleStep;
