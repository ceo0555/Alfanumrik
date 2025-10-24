import React from 'react';
import { InteractiveVideoStep as InteractiveVideoStepType } from '../types';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';

interface InteractiveVideoStepProps {
  content: InteractiveVideoStepType['content'];
  skillId: string;
  onAnswer: (skillId: string, isCorrect: boolean) => void;
  onCompleted: () => void;
}

const InteractiveVideoStep: React.FC<InteractiveVideoStepProps> = ({ content, skillId, onAnswer, onCompleted }) => {
  // Mark step as completable as soon as it's viewed
  React.useEffect(() => {
    onCompleted();
  }, [onCompleted]);
  
  return (
    <div>
        <h3 className="font-bold text-xl text-slate-800 mb-4">{content.title}</h3>
        <InteractiveVideoPlayer 
            videoData={content}
            skillId={skillId}
            onAnswer={onAnswer}
        />
    </div>
  );
};

export default InteractiveVideoStep;