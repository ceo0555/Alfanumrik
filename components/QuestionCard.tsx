import React, { useState, useRef, useEffect } from 'react';
import { QuestionPoolItem, ScratchpadState } from '../types';
import { ThumbsDownIcon, ThumbsUpIcon, SparklesIcon, NotebookIcon, MicrophoneIcon, StopCircleIcon } from '../constants/icons';
import { gradeShortAnswer, analyzeScratchpadForErrorAnalysis, gradeVerbalExplanation } from '../services/geminiService';
import DigitalScratchpad from './DigitalScratchpad';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface QuestionCardProps {
  questionData: QuestionPoolItem;
  questionNumber: number;
  stepAnswer?: { answer: string | null; isCorrect: boolean };
  onStepAnswer: (answer: string | null, isCorrect: boolean, errorType?: string) => void;
  isGeneratingRemediation?: boolean;
}

const DifficultyBadge: React.FC<{ difficulty: 'E' | 'M' | 'H' }> = ({ difficulty }) => {
  const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
  const colorClasses = {
    H: 'bg-red-100 text-red-800', // Hard
    M: 'bg-yellow-100 text-yellow-800', // Medium
    E: 'bg-green-100 text-green-800', // Easy
  };
  const text = {
    H: 'High',
    M: 'Medium',
    E: 'Easy'
  };
  return <span className={`${baseClasses} ${colorClasses[difficulty]}`}>{text[difficulty]}</span>;
};

const QuestionCard: React.FC<QuestionCardProps> = ({ questionData, questionNumber, stepAnswer, onStepAnswer, isGeneratingRemediation }) => {
  const [currentMcqSelection, setCurrentMcqSelection] = useState<string | null>(null);
  const [currentShortAnswer, setCurrentShortAnswer] = useState('');
  const [isAiGrading, setIsAiGrading] = useState(false);
  
  // Digital Scratchpad State
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadState, setScratchpadState] = useState<ScratchpadState>({ paths: [] });
  const scratchpadRef = useRef<{ getCanvasDataURL: () => string | null }>(null);

  // Verbal Explanation State
  const { status: recorderStatus, audioBlob, startRecording, stopRecording, reset: resetRecorder } = useAudioRecorder();
  const [verbalAnswerResult, setVerbalAnswerResult] = useState<{ transcript: string, awardedMarks: number, feedback: string } | null>(null);


  const isAnswered = !!stepAnswer;
  const submittedAnswer = stepAnswer?.answer;

  useEffect(() => {
    setCurrentMcqSelection(null);
    setCurrentShortAnswer('');
    setIsAiGrading(false);
    setVerbalAnswerResult(null);
    resetRecorder();
  }, [questionData, resetRecorder]);

  useEffect(() => {
    if (recorderStatus === 'stopped' && audioBlob) {
        const gradeAnswer = async () => {
            setIsAiGrading(true);
            try {
                const result = await gradeVerbalExplanation(questionData, audioBlob);
                setVerbalAnswerResult(result);
                const isCorrect = result.awardedMarks === questionData.marks;
                onStepAnswer(result.transcript, isCorrect); // Use transcript as the "answer" for logging
            } catch (e) {
                console.error("Verbal grading failed", e);
                onStepAnswer("Error during AI grading.", false);
            } finally {
                setIsAiGrading(false);
            }
        };
        gradeAnswer();
    }
  }, [recorderStatus, audioBlob, questionData, onStepAnswer]);

  const handleMcqSelect = (option: string) => {
    if (isAnswered) return;
    setCurrentMcqSelection(option);
  };
  
  const checkAnswer = async () => {
      if (isAnswered) return;
      
      let isCorrect: boolean;
      let userAnswer: string | null;
      let errorType: string | undefined = undefined;

      if (questionData.type === 'MCQ') {
          userAnswer = currentMcqSelection;
          isCorrect = userAnswer === questionData.answer;
          onStepAnswer(userAnswer, isCorrect);
      } else { // Handles 'SA', 'LA', etc. with AI grading
          userAnswer = currentShortAnswer;
          setIsAiGrading(true);
          try {
            const result = await gradeShortAnswer(questionData.question, questionData.rubric, questionData.marks, userAnswer);
            isCorrect = result.awardedMarks === questionData.marks;

            if (!isCorrect) {
                const imageData = scratchpadRef.current?.getCanvasDataURL();
                if (imageData) {
                    errorType = await analyzeScratchpadForErrorAnalysis(imageData, questionData.question);
                }
            }
            onStepAnswer(userAnswer, isCorrect, errorType);
          } catch (e) {
            console.error("AI grading failed, falling back to simple check.", e);
            isCorrect = userAnswer.trim().toLowerCase() === questionData.answer.trim().toLowerCase();
            onStepAnswer(userAnswer, isCorrect);
          } finally {
            setIsAiGrading(false);
          }
      }
  };

  const getOptionClasses = (option: string) => {
    const selectedOption = isAnswered ? submittedAnswer : currentMcqSelection;
    if (!isAnswered) {
      return selectedOption === option
        ? 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-500'
        : 'hover:bg-slate-100 hover:border-slate-300 border-slate-200';
    }
    if (option === questionData.answer) {
      return 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500 border-emerald-500';
    }
    if (option === selectedOption && option !== questionData.answer) {
      return 'bg-red-100 text-red-900 ring-2 ring-red-500 border-red-500';
    }
    return 'bg-slate-50 border-slate-200 text-slate-600';
  };
  
  const showScratchpad = questionData.type !== 'MCQ' && questionData.type !== 'VerbalExplanation';

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-6 last:mb-0">
        <div className="flex justify-between items-start mb-4">
          <p className="text-lg font-semibold text-slate-800">
            <span className="text-indigo-600 mr-2">Q{questionNumber}.</span>{questionData.question}
          </p>
          <div className="flex-shrink-0 ml-4 space-x-2 flex items-center">
              {showScratchpad && (
                  <button onClick={() => setIsScratchpadOpen(true)} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50">
                      <NotebookIcon className="w-5 h-5" />
                      Rough Work
                  </button>
              )}
              <DifficultyBadge difficulty={questionData.difficulty} />
          </div>
        </div>

        {questionData.type === 'MCQ' && questionData.options && (
          <div className="space-y-3">
            {questionData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleMcqSelect(option)}
                disabled={isAnswered}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${getOptionClasses(option)}`}
              >
                <span className="font-mono mr-3 text-indigo-600">{String.fromCharCode(65 + index)}.</span>
                <span className="font-semibold">{option}</span>
              </button>
            ))}
          </div>
        )}
        
        {['SA', 'LA', 'Case', 'Competency'].includes(questionData.type) && (
          <textarea
              className="form-textarea w-full p-3 rounded-lg"
              rows={4}
              placeholder="Type your answer here..."
              value={isAnswered ? (submittedAnswer || '') : currentShortAnswer}
              onChange={(e) => setCurrentShortAnswer(e.target.value)}
              readOnly={isAnswered}
          />
        )}

        {questionData.type === 'VerbalExplanation' && !isAnswered && (
            <div className="text-center p-4 border-2 border-dashed rounded-lg">
                <p className="text-slate-500 mb-4">Explain your answer out loud. Click the microphone to start recording.</p>
                {recorderStatus === 'idle' && (
                    <button onClick={startRecording} className="btn btn-primary"><MicrophoneIcon className="w-5 h-5 mr-2" /> Record Answer</button>
                )}
                {recorderStatus === 'recording' && (
                     <button onClick={stopRecording} className="btn bg-red-500 hover:bg-red-600 text-white"><StopCircleIcon className="w-5 h-5 mr-2 animate-pulse" /> Stop Recording</button>
                )}
                {recorderStatus === 'stopped' && (
                    <p className="font-semibold text-indigo-600">Processing audio...</p>
                )}
            </div>
        )}


        {!isAnswered && questionData.type !== 'VerbalExplanation' && (
          <div className="mt-4 text-right">
            <button
              onClick={checkAnswer}
              disabled={isAiGrading || (questionData.type === 'MCQ' ? !currentMcqSelection : !currentShortAnswer.trim())}
              className="btn btn-primary min-w-[150px]"
            >
              {isAiGrading ? (
                <span className="flex items-center justify-center gap-2"><SparklesIcon className="w-5 h-5 animate-spin" /> Grading...</span>
              ) : (
                'Check Answer'
              )}
            </button>
          </div>
        )}

        {isAnswered && (
          <div className="mt-4 space-y-3">
              {stepAnswer?.isCorrect ? (
                  <div className="p-3 rounded-lg bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-2">
                      <ThumbsUpIcon className="w-5 h-5"/> Correct!
                  </div>
              ) : (
                  <div className="p-3 rounded-lg bg-red-100 text-red-800 font-semibold flex items-center gap-2">
                      <ThumbsDownIcon className="w-5 h-5"/> Incorrect
                  </div>
              )}

              {verbalAnswerResult && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                    <div>
                        <h4 className="font-bold text-sm text-slate-500">Your Answer (Transcript):</h4>
                        <p className="text-slate-700 italic">"{verbalAnswerResult.transcript}"</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-sm text-slate-500">AI Feedback:</h4>
                        <p className="text-slate-700">{verbalAnswerResult.feedback}</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-sm text-slate-500">Score:</h4>
                        <p className="font-bold text-indigo-600">{verbalAnswerResult.awardedMarks} / {questionData.marks}</p>
                    </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-800">Exemplar Answer & Rubric</h4>
                  <p className="mt-1 font-semibold text-slate-700">{questionData.answer}</p>
                  <p className="mt-2 text-sm text-slate-600">{questionData.rubric}</p>
              </div>
          </div>
        )}
        {isAnswered && !stepAnswer?.isCorrect && isGeneratingRemediation && (
          <div className="mt-2 text-sm text-indigo-600 font-semibold animate-pulse">
              Generating a quick review to help with this concept...
          </div>
        )}
      </div>

      {showScratchpad && (
          <DigitalScratchpad 
            ref={scratchpadRef}
            isOpen={isScratchpadOpen}
            onClose={() => setIsScratchpadOpen(false)}
            initialState={scratchpadState}
            onSave={setScratchpadState}
            questionText={questionData.question}
          />
      )}
    </>
  );
};

export default React.memo(QuestionCard);