import React, { useState, useRef, useEffect } from 'react';
import { InteractiveVideo, VideoQuestion } from '../types';
import { CheckCircleIcon, XIcon, ThumbsUpIcon, ThumbsDownIcon } from '../constants/icons';

interface InteractiveVideoPlayerProps {
  videoData: InteractiveVideo;
  skillId: string;
  onAnswer: (skillId: string, isCorrect: boolean) => void;
}

const InteractiveVideoPlayer: React.FC<InteractiveVideoPlayerProps> = ({ videoData, skillId, onAnswer }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeQuestion, setActiveQuestion] = useState<VideoQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean, text: string } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      // Don't interrupt if a question is already active
      if (activeQuestion) return;

      const currentTime = video.currentTime;
      const questionToShow = videoData.script.find(
        q => Math.abs(q.timestamp - currentTime) < 0.5
      );

      if (questionToShow) {
        video.pause();
        setActiveQuestion(questionToShow);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [videoData.script, activeQuestion]);

  const handleSubmitAnswer = () => {
    if (!activeQuestion || !selectedOption) return;

    const isCorrect = selectedOption === activeQuestion.correct_answer;
    setFeedback({
      isCorrect,
      text: isCorrect ? activeQuestion.feedback_correct : activeQuestion.feedback_incorrect
    });
    
    // Report to BKT system
    onAnswer(skillId, isCorrect);
  };
  
  const handleContinue = () => {
      const video = videoRef.current;
      if (!video || !activeQuestion) return;

      const wasCorrect = selectedOption === activeQuestion.correct_answer;
      
      // Reset state
      setFeedback(null);
      setSelectedOption(null);
      setActiveQuestion(null);
      
      // Handle branching or continue
      if (!wasCorrect && activeQuestion.branch_on_incorrect !== undefined) {
          video.currentTime = activeQuestion.branch_on_incorrect;
      }
      
      video.play();
  };

  const getOptionClasses = (option: string) => {
    if (!feedback) {
        return selectedOption === option
            ? 'ring-2 ring-indigo-500 bg-indigo-50'
            : 'hover:bg-slate-100';
    }
    if (option === activeQuestion?.correct_answer) {
        return 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500';
    }
    if (option === selectedOption && option !== activeQuestion?.correct_answer) {
        return 'bg-red-100 text-red-800 ring-2 ring-red-500';
    }
    return 'bg-slate-50 text-slate-500';
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        src={videoData.video_url}
        onPlay={() => activeQuestion && videoRef.current?.pause()} // Prevent playing while question is up
      />
      {activeQuestion && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h4 className="font-bold text-lg text-slate-800 mb-4">{activeQuestion.question_text}</h4>
            
            <div className="space-y-2 mb-4">
                {activeQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => !feedback && setSelectedOption(option)}
                        className={`w-full text-left p-3 rounded-lg border border-slate-200 transition-all ${getOptionClasses(option)}`}
                    >
                        <span className="font-mono mr-3 text-indigo-600">{String.fromCharCode(65 + index)}.</span>
                        {option}
                    </button>
                ))}
            </div>
            
            {!feedback ? (
                <button 
                    onClick={handleSubmitAnswer} 
                    disabled={!selectedOption}
                    className="btn btn-primary w-full"
                >
                    Submit
                </button>
            ) : (
                <>
                    <div className={`p-3 rounded-lg border ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <h5 className={`font-bold flex items-center gap-2 ${feedback.isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                            {feedback.isCorrect ? <ThumbsUpIcon className="w-5 h-5"/> : <ThumbsDownIcon className="w-5 h-5" />}
                            <span>{feedback.isCorrect ? 'Correct!' : 'Not Quite'}</span>
                        </h5>
                        <p className="text-sm mt-1">{feedback.text}</p>
                    </div>
                    <button onClick={handleContinue} className="btn btn-primary w-full mt-3">
                        Continue Video
                    </button>
                </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveVideoPlayer;