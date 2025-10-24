import React from 'react';
import { ImageBriefStep as ImageBriefStepType } from '../types';
import { cleanText } from '../utils/textHelpers';

interface ImageBriefStepProps {
  content: ImageBriefStepType['content'];
}

const ImageBriefStep: React.FC<ImageBriefStepProps> = ({ content: brief }) => {
  return (
    <div className="my-4 p-4 bg-slate-50 rounded-lg border border-[var(--border-color)]">
      <h3 className="font-bold mb-2">{cleanText(brief.purpose)}</h3>
      {brief.generated_image_url ? (
        <img src={brief.generated_image_url} alt={brief.alt_text} className="max-w-full h-auto rounded-md mx-auto shadow-md" />
      ) : brief.optional_svg_markup ? (
        <div className="flex justify-center p-4" dangerouslySetInnerHTML={{ __html: brief.optional_svg_markup }} />
      ) : (
        <p className="text-slate-500">Visual aid could not be generated.</p>
      )}
    </div>
  );
};

export default ImageBriefStep;
