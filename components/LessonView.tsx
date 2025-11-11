import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdaptiveLessonPlayer from './AdaptiveLessonPlayer';
import { LtiContext, LessonPack, TutorInterventionContext } from '../types';
import { fetchTopicContent, ProgressData } from '../services/geminiService';
import ProgressLoader from './ProgressLoader';
import LessonPlayerSkeleton from './LessonPlayerSkeleton';

interface LessonViewProps {
  isTransitioning: boolean;
  ltiContext: LtiContext | null;
  onFinish: () => void;
  setAiContext: (context: string | null) => void;
  onProgressUpdate: (isInProgress: boolean) => void;
  onTriggerTutorIntervention: (context: TutorInterventionContext) => void;
}

const LessonView: React.FC<LessonViewProps> = ({ isTransitioning, ltiContext, onFinish, setAiContext, onProgressUpdate, onTriggerTutorIntervention }) => {
  const { activeTopic } = useAuth();
  
  const [lessonPack, setLessonPack] = useState<LessonPack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressData>({ progress: 0, message: 'Preparing your lesson...', step: 0, totalSteps: 1 });

  useEffect(() => {
    if (!activeTopic) return;

    const { chapter, topic } = activeTopic;
    let isCancelled = false;

    const loadLesson = async () => {
      setIsLoading(true);
      setError(null);
      setLessonPack(null);
      
      try {
        const data = await fetchTopicContent(chapter, topic, (progress) => {
          if (!isCancelled) {
            setProgressData(progress);
          }
        });
        if (!isCancelled) {
          setLessonPack(data);
        }
      } catch (e) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : "An unknown error occurred while loading the lesson.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLesson();

    return () => {
      isCancelled = true;
    };
  }, [activeTopic]);

  if (!activeTopic) {
    return <p>No active topic selected.</p>;
  }

  if (isLoading) {
    return <ProgressLoader />;
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-xl">
        <h1 className="text-2xl font-bold text-red-600">Failed to Load Lesson</h1>
        <p className="text-slate-600 mt-2">{error}</p>
      </div>
    );
  }

  if (lessonPack) {
    return (
      <AdaptiveLessonPlayer
        lessonPack={lessonPack}
        ltiContext={ltiContext}
        isTransitioning={isTransitioning}
        onFinish={onFinish}
        setAiContext={setAiContext}
        onProgressUpdate={onProgressUpdate}
        onTriggerTutorIntervention={onTriggerTutorIntervention}
      />
    );
  }
  
  // Should ideally not be reached, but as a fallback
  return <LessonPlayerSkeleton />;
};

export default LessonView;