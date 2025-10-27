import React from 'react';
import { AssessmentQuestionStep as AssessmentQuestionStepType } from '../types';
import QuestionCard from './QuestionCard';

interface AssessmentQuestionStepProps {
  content: AssessmentQuestionStepType['content'];
  stepAnswer?: { answer: string | null; isCorrect: boolean };
  onStepAnswer: (answer: string | null, isCorrect: boolean) => void;
  isGeneratingRemediation?: boolean;
}

const AssessmentQuestionStep: React.FC<AssessmentQuestionStepProps> = ({ content, stepAnswer, onStepAnswer, isGeneratingRemediation }) => {
  return (
    <QuestionCard
      questionData={content.question}
      questionNumber={content.qNum}
      stepAnswer={stepAnswer}
      onStepAnswer={onStepAnswer}
      isGeneratingRemediation={isGeneratingRemediation}
    />
  );
};

export default AssessmentQuestionStep;
