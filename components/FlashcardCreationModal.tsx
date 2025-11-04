import React, { useState, useEffect } from 'react';
import { fetchChapterContent, generateFlashcards } from '../services/geminiService';
import { Flashcard } from '../types';
import { XIcon, LayersIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';

interface FlashcardCreationModalProps {
  chapterInfo: { grade: string; subject: string; chapter: string; };
  onClose: () => void;
}

type LoadingState = 'idle' | 'fetchingContent' | 'generatingCards' | 'done' | 'error';

const FlashcardCreationModal: React.FC<FlashcardCreationModalProps> = ({ chapterInfo, onClose }) => {
  const { handleSaveFlashcards } = useStudentData();
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const chapterId = `G${chapterInfo.grade}-${chapterInfo.subject}-${chapterInfo.chapter}`;

  useEffect(() => {
    const createCards = async () => {
      try {
        setLoadingState('fetchingContent');
        const lessonPack = await fetchChapterContent(chapterInfo.grade, chapterInfo.subject, chapterInfo.chapter);
        
        setLoadingState('generatingCards');
        const cards = await generateFlashcards(lessonPack);
        setGeneratedCards(cards);
        setLoadingState('done');
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setLoadingState('error');
      }
    };

    createCards();
  }, [chapterInfo]);

  const handleSave = () => {
    handleSaveFlashcards(chapterId, generatedCards);
    onClose();
  };

  const renderContent = () => {
    switch(loadingState) {
      case 'fetchingContent':
      case 'generatingCards':
        return (
          <div className="text-center p-8">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[var(--brand-primary)] mx-auto"></div>
            <p className="mt-4 text-slate-500 font-semibold">
              {loadingState === 'fetchingContent' ? 'Analyzing lesson content...' : 'Generating flashcards with AI...'}
            </p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">
            <h4 className="font-bold">Generation Failed</h4>
            <p className="text-sm mt-1">{error}</p>
            <button onClick={onClose} className="btn btn-primary bg-red-600 hover:bg-red-700 mt-4">Close</button>
          </div>
        );
      case 'done':
        return (
          <>
            <div className="max-h-80 overflow-y-auto space-y-3 p-1">
              {generatedCards.map((card, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-[var(--border-color)]">
                  <p className="font-semibold text-sm text-slate-800">{card.term}</p>
                  <p className="text-sm text-slate-600 mt-1">{card.definition}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-4">
              <button onClick={onClose} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">Discard</button>
              <button onClick={handleSave} className="btn btn-primary w-full">Save to My Studio</button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} aria-modal="true">
      <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <LayersIcon className="w-6 h-6 text-[var(--brand-primary)]" />
            Create Flashcards
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </header>
        <div className="p-6">{renderContent()}</div>
      </div>
    </div>
  );
};

export default FlashcardCreationModal;