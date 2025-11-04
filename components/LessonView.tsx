import React from 'react';
import { useLessonData } from '../hooks/useLessonData';
import { useAuth } from '../contexts/AuthContext';
import AdaptiveLessonPlayer from './AdaptiveLessonPlayer';
import { LtiContext } from '../types';

interface LessonViewProps {
  isTransitioning: boolean;
  ltiContext: LtiContext | null;
  onFinish: () => void;
  setAiContext: (context: string | null) => void;
}

const LessonView: React.FC<LessonViewProps> = ({ isTransitioning, ltiContext, onFinish, setAiContext }) => {
  const { activeProfile } = useAuth();

  if (!activeProfile) {
    // This case should be handled by the parent component, but as a safeguard:
    return <p>No active profile selected.</p>;
  }
  
  const { grade, lastSubject, lastChapter } = activeProfile;
  
  // This hook will suspend while fetching
  const lessonPack = useLessonData(grade, lastSubject, lastChapter);
  
  return (
    <AdaptiveLessonPlayer
      lessonPack={lessonPack}
      ltiContext={ltiContext}
      isTransitioning={isTransitioning}
      onFinish={onFinish}
      setAiContext={setAiContext}
    />
  );
};

export default LessonView;