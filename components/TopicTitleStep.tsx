import React from 'react';
import { TopicTitleStep as TopicTitleStepType } from '../types';

interface TopicTitleStepProps {
  content: TopicTitleStepType['content'];
}

const TopicTitleStep: React.FC<TopicTitleStepProps> = ({ content }) => {
  return (
    <div className="text-center">
      <h1 className="text-5xl font-extrabold text-slate-800 mb-2">{content.topic_name}</h1>
      <p className="text-lg text-slate-500 mb-10">An adaptive lesson generated just for you.</p>
    </div>
  );
};

export default TopicTitleStep;
