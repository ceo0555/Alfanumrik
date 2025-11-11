import React from 'react';
import { CheckCircleIcon, TriangleAlertIcon } from '../constants/icons';

interface ExitLessonConfirmationModalProps {
  isOpen: boolean;
  onSaveAndExit: () => void;
  onDiscardAndExit: () => void;
  onCancel: () => void;
}

const ExitLessonConfirmationModal: React.FC<ExitLessonConfirmationModalProps> = ({
  isOpen,
  onSaveAndExit,
  onDiscardAndExit,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <TriangleAlertIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Exit Lesson?</h2>
          <p className="text-slate-500 mt-2">Are you sure you want to leave this lesson?</p>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" title="Progress is saved" />
            <span>Your progress is automatically saved when you exit.</span>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex flex-col gap-2">
          <button onClick={onSaveAndExit} className="btn btn-primary w-full">
            Save & Exit
          </button>
          <button onClick={onDiscardAndExit} className="btn w-full bg-red-100 text-red-700 hover:bg-red-200">
            Discard Progress & Exit
          </button>
          <button onClick={onCancel} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitLessonConfirmationModal;
