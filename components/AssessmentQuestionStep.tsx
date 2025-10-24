import React from 'react';
import { AssessmentQuestionStep as AssessmentQuestionStepType } from '../types';
import QuestionCard from './QuestionCard';

interface AssessmentQuestionStepProps {
  content: AssessmentQuestionStepType['content'];
  onAnswerSubmit: (q_id: string, question_text: string, is_correct: boolean) => void;
  skillId: string;
  onAnswer: (skillId: string, isCorrect: boolean) => void;
}

const AssessmentQuestionStep: React.FC<AssessmentQuestionStepProps> = ({ content, onAnswerSubmit, skillId, onAnswer }) => {
  return (
    <QuestionCard
      questionData={content.question}
      questionNumber={content.qNum}
      onAnswerSubmit={onAnswerSubmit}
      skillId={skillId}
      onAnswer={onAnswer}
    />
  );
};

export default AssessmentQuestionStep;