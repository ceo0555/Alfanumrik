import React from 'react';
import { CommonErrorStep as CommonErrorStepType } from '../types';
import { cleanText } from '../utils/textHelpers';

interface CommonErrorStepProps {
  content: CommonErrorStepType['content'];
}

const CommonErrorStep: React.FC<CommonErrorStepProps> = ({ content }) => {
  return (
    <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
      <h3 className="font-bold text-lg text-red-800">Common Mistake to Avoid</h3>
      <div className="mt-3">
        <p className="font-semibold text-slate-800">The Mistake:</p>
        <p className="p-2 bg-red-100/50 rounded text-slate-700">{cleanText(content.error)}</p>
      </div>
      <div className="mt-3">
        <p className="font-semibold text-slate-800">The Correction:</p>
        <p className="p-2 bg-emerald-100/50 rounded text-slate-700">{cleanText(content.fix)}</p>
      </div>
    </div>
  );
};

export default CommonErrorStep;
