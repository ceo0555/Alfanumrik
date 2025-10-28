import React, { useState } from 'react';
import { LockIcon } from '../constants/icons';

interface HonourCodeModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onClose: () => void;
}

const HonourCodeModal: React.FC<HonourCodeModalProps> = ({ isOpen, onAgree, onClose }) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Entering Focus Mode</h2>
          <p className="text-slate-500 mt-2">To ensure a fair and focused practice session, please agree to the following Honour Code.</p>
          
          <ul className="text-left text-sm text-slate-600 mt-4 space-y-2 bg-slate-50 p-4 rounded-lg">
            <li>✔️ I will not switch tabs or minimize the browser.</li>
            <li>✔️ I will not use any outside help or resources.</li>
            <li>✔️ I understand that leaving the exam window will be tracked.</li>
          </ul>

          <div className="mt-6">
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="w-5 h-5 rounded" />
              <span className="font-semibold text-slate-700">I agree to the Honour Code.</span>
            </label>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex gap-4">
          <button onClick={onClose} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>
          <button onClick={onAgree} disabled={!agreed} className="btn btn-primary w-full">Start Exam</button>
        </div>
      </div>
    </div>
  );
};

export default HonourCodeModal;