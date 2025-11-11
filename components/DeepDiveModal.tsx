import React from 'react';
import { XIcon, BrainCircuitIcon } from '../constants/icons';
import MarkdownRenderer from './MarkdownRenderer';
import Loader from './Loader';

interface DeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  content: string;
  title: string;
}

const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ isOpen, onClose, isLoading, content, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-scale-in" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuitIcon className="w-6 h-6 text-indigo-500" />
            Deep Dive: {title.substring(0, 30)}{title.length > 30 ? '...' : ''}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-10">
              <Loader />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-slate">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeepDiveModal;