import React, { useState } from 'react';
import { FlashcardReviewItem } from '../types';
import { useStudentData } from '../contexts/StudentDataContext';
import { LayersIcon } from '../constants/icons';

interface ReviewQueueProps {
    reviewItems: FlashcardReviewItem[];
}

// Map UI buttons to FSRS/Anki quality ratings (1-4)
const ratingMap: { [key: string]: 1 | 2 | 3 | 4 } = {
    again: 1,
    hard: 2,
    good: 3,
    easy: 4,
};

const ReviewQueue: React.FC<ReviewQueueProps> = ({ reviewItems }) => {
    const { gradeFlashcard } = useStudentData();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

    const currentItem = reviewItems[currentIndex];
    
    const handlePerformanceSelect = (performance: 'again' | 'hard' | 'good' | 'easy') => {
        if (!currentItem) return;

        const rating = ratingMap[performance];
        gradeFlashcard(currentItem.chapterId, currentItem.cardIndex, rating);
        
        setSessionStats(prev => ({ ...prev, [performance]: prev[performance] + 1 }));

        // Move to the next card
        if (currentIndex < reviewItems.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        } else {
            // End of queue
            setCurrentIndex(currentIndex + 1);
        }
    };
    
    if (reviewItems.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-[var(--border-color)]">
                <LayersIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-slate-700">All Caught Up!</h3>
                <p className="text-slate-500 mt-1">You have no flashcards to review today. Great job!</p>
            </div>
        );
    }
    
    if (currentIndex >= reviewItems.length) {
        return (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-[var(--border-color)]">
                <h3 className="font-bold text-lg text-slate-700">Review Session Complete!</h3>
                <p className="text-slate-500 mt-1">You reviewed {reviewItems.length} card(s).</p>
                <div className="mt-4 flex justify-center gap-4 text-sm">
                    <span className="font-semibold text-red-600">Again: {sessionStats.again}</span>
                    <span className="font-semibold text-orange-600">Hard: {sessionStats.hard}</span>
                    <span className="font-semibold text-blue-600">Good: {sessionStats.good}</span>
                    <span className="font-semibold text-green-600">Easy: {sessionStats.easy}</span>
                </div>
                 <button onClick={() => { setCurrentIndex(0); setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 }); setIsFlipped(false); }} className="btn btn-primary mt-6">
                    Start Over
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-slate-500">Cards due for review:</p>
                <p className="font-semibold text-slate-700">{currentIndex + 1} / {reviewItems.length}</p>
            </div>
            
            <div className="relative h-64 w-full perspective-1000 mb-4">
                <div 
                    className={`w-full h-full absolute transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                    role="button"
                    aria-label={`Flashcard: ${currentItem.card.term}. Click to flip.`}
                >
                    <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-white rounded-lg border-2 border-[var(--border-color)] shadow-lg cursor-pointer">
                        <p className="text-2xl font-bold text-slate-800 text-center">{currentItem.card.term}</p>
                    </div>
                    <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-slate-700 text-white rounded-lg border-2 border-slate-800 shadow-lg cursor-pointer rotate-y-180">
                        <p className="text-lg font-semibold text-center">{currentItem.card.definition}</p>
                    </div>
                </div>
            </div>

            {isFlipped && (
                <div className="grid grid-cols-4 gap-2 animate-fade-in">
                    <button onClick={() => handlePerformanceSelect('again')} className="p-3 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Again</button>
                    <button onClick={() => handlePerformanceSelect('hard')} className="p-3 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">Hard</button>
                    <button onClick={() => handlePerformanceSelect('good')} className="p-3 text-sm font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">Good</button>
                    <button onClick={() => handlePerformanceSelect('easy')} className="p-3 text-sm font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">Easy</button>
                </div>
            )}

            <style>{`
              .perspective-1000 { perspective: 1000px; }
              .transform-style-3d { transform-style: preserve-3d; }
              .rotate-y-180 { transform: rotateY(180deg); }
              .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
            `}</style>
        </div>
    );
};

export default ReviewQueue;