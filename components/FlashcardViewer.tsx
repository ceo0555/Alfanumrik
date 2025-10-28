import React, { useState, useEffect } from 'react';
import { LayersIcon, ArrowLeftIcon, ArrowRightIcon, ClipboardListIcon, CheckCircleIcon, XIcon, ThumbsUpIcon, ThumbsDownIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';
import { Flashcard, UserFlashcardItem } from '../types';
import { checkFlashcardAnswer } from '../services/geminiService';

const FlashcardViewer: React.FC = () => {
  const { userFlashcards } = useStudentData();
  
  // General State
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  
  // Review Mode State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz Mode State
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [shuffledDeck, setShuffledDeck] = useState<UserFlashcardItem[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [quizHistory, setQuizHistory] = useState<{ card: Flashcard; userAnswer: string; isCorrect: boolean }[]>([]);

  const availableDecks = Object.keys(userFlashcards || {});

  useEffect(() => {
    if (availableDecks.length > 0 && (!selectedDeckId || !availableDecks.includes(selectedDeckId))) {
      setSelectedDeckId(availableDecks[0]);
    } else if (availableDecks.length === 0) {
      setSelectedDeckId(null);
    }
  }, [userFlashcards, availableDecks, selectedDeckId]);

  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setQuizActive(false);
  }, [selectedDeckId, isQuizMode]);

  const startQuiz = () => {
    const deck = selectedDeckId ? userFlashcards?.[selectedDeckId] : null;
    if (!deck) return;
    setShuffledDeck([...deck].sort(() => Math.random() - 0.5));
    setCurrentQuizIndex(0);
    setQuizHistory([]);
    setAnswerFeedback(null);
    setUserAnswer('');
    setQuizActive(true);
  };

  const handleAnswerSubmit = async () => {
    const currentCard = shuffledDeck[currentQuizIndex];
    if (!currentCard || !userAnswer.trim()) return;

    setIsCheckingAnswer(true);
    setAnswerFeedback(null);
    try {
        const result = await checkFlashcardAnswer(userAnswer, currentCard.card.definition, currentCard.card.term);
        setAnswerFeedback(result);
        setQuizHistory(prev => [...prev, { card: currentCard.card, userAnswer, isCorrect: result.isCorrect }]);
    } catch(err) {
        console.error(err);
        const fallbackResult = { isCorrect: false, feedback: "Error checking answer. Please try again." };
        setAnswerFeedback(fallbackResult);
        setQuizHistory(prev => [...prev, { card: currentCard.card, userAnswer, isCorrect: false }]);
    } finally {
        setIsCheckingAnswer(false);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < shuffledDeck.length) {
        setCurrentQuizIndex(prev => prev + 1);
        setAnswerFeedback(null);
        setUserAnswer('');
    }
  };

  const resetQuiz = () => {
    setQuizActive(false);
    setQuizHistory([]);
    setCurrentQuizIndex(0);
  };

  const handleNextReview = () => {
    const selectedDeck = selectedDeckId ? userFlashcards?.[selectedDeckId] : null;
    if (selectedDeck && currentCardIndex < selectedDeck.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevReview = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };
  
  const getDeckName = (deckId: string) => {
      const [, grade, subject, ...chapterParts] = deckId.split('-');
      const chapter = chapterParts.join('-');
      return `${chapter} (${subject}, Class ${grade})`;
  };

  const renderNoFlashcards = () => (
    <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full">
      <LayersIcon className="w-16 h-16 mb-4 text-slate-300" />
      <h3 className="text-xl font-bold text-slate-700">No Flashcards Yet</h3>
      <p className="mt-2">Go to the 'Learn' tab to generate flashcards for a chapter.</p>
    </div>
  );

  const renderReviewMode = () => {
    const selectedDeck = selectedDeckId ? userFlashcards?.[selectedDeckId] : null;
    const currentCard = selectedDeck ? selectedDeck[currentCardIndex] : null;
    if (!currentCard) return null;

    return (
      <>
        <div className="relative h-64 w-full perspective-1000">
          <div 
            className={`w-full h-full absolute transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
            role="button"
            aria-label={`Flashcard: ${currentCard.card.term}. Click to flip.`}
          >
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-white rounded-lg border-2 border-[var(--border-color)] shadow-lg cursor-pointer">
              <p className="text-2xl font-bold text-slate-800">{currentCard.card.term}</p>
            </div>
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-[var(--brand-primary)] text-white rounded-lg border-2 border-[var(--brand-primary-hover)] shadow-lg cursor-pointer rotate-y-180">
              <p className="text-lg font-semibold">{currentCard.card.definition}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={handlePrevReview} disabled={currentCardIndex === 0} className="btn flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50">
              <ArrowLeftIcon className="w-5 h-5"/> Prev
          </button>
          <p className="font-semibold text-slate-500">{currentCardIndex + 1} / {selectedDeck?.length}</p>
          <button onClick={handleNextReview} disabled={!selectedDeck || currentCardIndex === selectedDeck.length - 1} className="btn flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50">
              Next <ArrowRightIcon className="w-5 h-5"/>
          </button>
        </div>
      </>
    );
  };

  const renderQuizMode = () => {
    const currentCard = shuffledDeck[currentQuizIndex];
    const quizFinished = currentQuizIndex >= shuffledDeck.length;

    if (!quizActive) {
        return (
            <div className="text-center p-8 bg-slate-50 rounded-lg">
                <h4 className="text-lg font-bold text-slate-700">Ready to test your knowledge?</h4>
                <p className="text-slate-500 mt-2">The quiz will show you a term, and you'll type the definition.</p>
                <button onClick={startQuiz} className="btn btn-primary mt-4">Start Quiz</button>
            </div>
        );
    }
    
    if (quizFinished) {
        const score = quizHistory.filter(h => h.isCorrect).length;
        return (
            <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-xl font-bold text-center text-slate-700">Quiz Complete!</h4>
                <p className="text-center text-3xl font-bold my-4 text-[var(--brand-primary)]">{score} / {shuffledDeck.length}</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {quizHistory.map((item, index) => (
                        <details key={index} className="p-2 bg-white rounded border">
                            <summary className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                                {item.isCorrect ? <CheckCircleIcon className="w-4 h-4 text-emerald-500"/> : <XIcon className="w-4 h-4 text-red-500"/>}
                                {item.card.term}
                            </summary>
                            <div className="mt-2 pt-2 border-t text-xs text-left">
                                <p className="text-slate-500"><strong>Your answer:</strong> {item.userAnswer}</p>
                                <p className="text-slate-500 mt-1"><strong>Correct answer:</strong> {item.card.definition}</p>
                            </div>
                        </details>
                    ))}
                </div>
                <button onClick={resetQuiz} className="btn btn-primary mt-4 w-full">Try Again</button>
            </div>
        )
    }

    if (!currentCard) return null;

    return (
        <div>
            <p className="text-slate-500 font-semibold mb-2 text-left">Question {currentQuizIndex + 1} of {shuffledDeck.length}</p>
            <div className="p-6 bg-white rounded-lg border-2 border-[var(--border-color)] shadow-lg min-h-[10rem] flex items-center justify-center">
                <p className="text-2xl font-bold text-slate-800">{currentCard.card.term}</p>
            </div>
            
            {!answerFeedback ? (
                 <div className="mt-4">
                    <textarea 
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your definition here..."
                        rows={4}
                        className="form-textarea w-full"
                        disabled={isCheckingAnswer}
                    />
                    <button onClick={handleAnswerSubmit} disabled={!userAnswer.trim() || isCheckingAnswer} className="btn btn-primary w-full mt-2">
                        {isCheckingAnswer ? 'Checking...' : 'Submit Answer'}
                    </button>
                 </div>
            ) : (
                <div className="mt-4">
                    <div className={`p-4 rounded-lg border-l-4 ${answerFeedback.isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'}`}>
                        <h5 className={`font-bold flex items-center gap-2 ${answerFeedback.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                           {answerFeedback.isCorrect ? <ThumbsUpIcon className="w-5 h-5"/> : <ThumbsDownIcon className="w-5 h-5" />}
                           Feedback
                        </h5>
                        <p className="text-sm mt-1">{answerFeedback.feedback}</p>
                        {!answerFeedback.isCorrect && <p className="text-sm mt-2"><strong>Correct Answer:</strong> {currentCard.card.definition}</p>}
                    </div>
                    <button onClick={handleNextQuizQuestion} className="btn btn-primary w-full mt-2">
                        Next Question
                    </button>
                </div>
            )}
        </div>
    );
  };


  if (!userFlashcards || availableDecks.length === 0) {
    return renderNoFlashcards();
  }

  return (
    <div className="text-center">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-800">{isQuizMode ? 'Quiz Time' : 'My Flashcards'}</h3>
        <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-lg">
          <button onClick={() => setIsQuizMode(false)} className={`px-3 py-1 text-sm font-semibold rounded-md ${!isQuizMode ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500'}`}>Review</button>
          <button onClick={() => setIsQuizMode(true)} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-1 ${isQuizMode ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500'}`}>
            <ClipboardListIcon className="w-4 h-4" /> Quiz Me
          </button>
        </div>
      </div>
      <p className="text-slate-500 mb-6">{isQuizMode ? 'Test your knowledge with active recall.' : 'Review the key concepts you\'ve saved.'}</p>
      
      <div className="max-w-md mx-auto">
        <label htmlFor="deck-select" className="sr-only">Select Deck</label>
        <select
          id="deck-select"
          value={selectedDeckId || ''}
          onChange={(e) => setSelectedDeckId(e.target.value)}
          className="form-select w-full mb-6"
        >
          {availableDecks.map(deckId => (
            <option key={deckId} value={deckId}>{getDeckName(deckId)}</option>
          ))}
        </select>

        {isQuizMode ? renderQuizMode() : renderReviewMode()}
      </div>

       <style>{`
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .rotate-y-180 { transform: rotateY(180deg); }
          .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        `}</style>
    </div>
  );
};

export default FlashcardViewer;
