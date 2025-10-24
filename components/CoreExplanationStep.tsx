import React from 'react';
import { CoreExplanationStep as CoreExplanationStepType } from '../types';
import { SparklesIcon } from '../constants/icons';
import KeyTermStep from './KeyTermStep';
import NoteStep from './NoteStep';

interface CoreExplanationStepProps {
  content: CoreExplanationStepType['content'];
  handleExplainSnippet: (event: React.MouseEvent, snippet: string) => void;
}

const CoreExplanationStep: React.FC<CoreExplanationStepProps> = ({ content, handleExplainSnippet }) => {
  return (
    <div className="prose prose-slate max-w-none prose-p:my-3 prose-p:leading-relaxed prose-h2:mt-6 prose-h2:mb-2 prose-ul:my-4">
      {content.map((block, index) => {
        const key = `block-${index}`;
        switch (block.type) {
          case 'heading':
            switch (block.level) {
              case 2: return <h2 key={key}>{block.content}</h2>;
              case 3: return <h3 key={key}>{block.content}</h3>;
              case 4: return <h4 key={key}>{block.content}</h4>;
              default: return <h4 key={key}>{block.content}</h4>;
            }
          case 'paragraph':
            return (
              <p key={key} className="relative group/para pr-8">
                {block.content}
                <button
                  onClick={(e) => handleExplainSnippet(e, block.content)}
                  className="absolute top-0.5 right-0 p-1 text-slate-400 rounded-full hover:bg-slate-200 hover:text-[var(--brand-primary)] opacity-0 group-hover/para:opacity-100 transition-opacity"
                  aria-label="Explain this paragraph"
                >
                  <SparklesIcon className="w-4 h-4" />
                </button>
              </p>
            );
          case 'list':
            return (
              <ul key={key} className="list-disc pl-6 space-y-1">
                {(block.items || []).map((item, i) => <li key={`${key}-item-${i}`}>{item}</li>)}
              </ul>
            );
          case 'key_term':
            return <KeyTermStep key={key} content={block} />;
          case 'note':
            return <NoteStep key={key} content={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default CoreExplanationStep;