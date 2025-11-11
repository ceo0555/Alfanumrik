import React from 'react';
import { AssessmentQuestionStep as AssessmentQuestionStepType, TutorInterventionContext } from '../types';
import QuestionCard from './QuestionCard';

interface AssessmentQuestionStepProps {
  content: AssessmentQuestionStepType['content'];
  stepAnswer?: { answer: string | null; isCorrect: boolean };
  onStepAnswer: (answer: string | null, isCorrect: boolean) => void;
  isGeneratingRemediation?: boolean;
  onTriggerIntervention: (context: TutorInterventionContext) => void;
}

const AssessmentQuestionStep: React.FC<AssessmentQuestionStepProps> = ({ content, stepAnswer, onStepAnswer, isGeneratingRemediation, onTriggerIntervention }) => {
  return (
    <QuestionCard
      questionData={content.question}
      questionNumber={content.qNum}
      stepAnswer={stepAnswer}
      onStepAnswer={onStepAnswer}
      isGeneratingRemediation={isGeneratingRemediation}
      onTriggerIntervention={onTriggerIntervention}
    />
  );
};

export default AssessmentQuestionStep;
