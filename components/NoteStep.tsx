import React from 'react';
import { NoteStep as NoteStepType } from '../types';

interface NoteStepProps {
  content: NoteStepType['content'];
}

const NoteStep: React.FC<NoteStepProps> = ({ content }) => {
  return (
    <div className="my-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
      <p className="text-yellow-800"><strong className="font-semibold">Note:</strong> {content.content}</p>
    </div>
  );
};

export default NoteStep;
