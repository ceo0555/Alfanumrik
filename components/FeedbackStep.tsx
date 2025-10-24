import React, { useState } from 'react';
import { ThumbsUpIcon, ThumbsDownIcon } from '../constants/icons';

const FeedbackStep: React.FC = () => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  return (
    <div className="text-center p-6 bg-slate-50 rounded-xl border border-[var(--border-color)]">
      {!feedbackSubmitted ? (
        <>
          <h3 className="font-semibold text-slate-700">Was this lesson helpful?</h3>
          <div className="mt-3 flex justify-center gap-4">
            <button onClick={() => setFeedbackSubmitted(true)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-100 transition-colors">
              <ThumbsUpIcon className="w-5 h-5 text-green-500" /> Helpful
            </button>
            <button onClick={() => setFeedbackSubmitted(true)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-100 transition-colors">
              <ThumbsDownIcon className="w-5 h-5 text-red-500" /> Needs Improvement
            </button>
          </div>
        </>
      ) : (
        <p className="font-semibold text-[var(--brand-primary)]">Thank you for your feedback!</p>
      )}
    </div>
  );
};

export default FeedbackStep;
