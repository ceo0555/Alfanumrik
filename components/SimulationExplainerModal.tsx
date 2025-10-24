import React, { useState, useEffect } from 'react';
import { InteractiveSimulation } from '../types';
import { generateSimulationExplanation } from '../services/geminiService';
import { XIcon, SparklesIcon } from '../constants/icons';

interface SimulationExplainerModalProps {
  simulationContent: InteractiveSimulation;
  onClose: () => void;
}

const SimulationExplainerModal: React.FC<SimulationExplainerModalProps> = ({ simulationContent, onClose }) => {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExplanation = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await generateSimulationExplanation(simulationContent.concept_link, simulationContent.description);
        setExplanation(result);
      } catch (err) {
        console.error(err);
        setError('Could not generate the simulation explanation. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExplanation();
  }, [simulationContent]);

  const renderMarkdown = (markdown: string) => {
    if (!markdown) return null;

    const processInline = (text: string): string => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>');           // Italic
    };

    const blocks = markdown.trim().split(/\n\s*\n/); // Split by one or more blank lines

    const html = blocks.map(block => {
        const trimmedBlock = block.trim();

        // Fenced Code Blocks for Math
        if (trimmedBlock.startsWith('```') && trimmedBlock.endsWith('```')) {
            const code = trimmedBlock.substring(3, trimmedBlock.length - 3).trim();
            const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre><code>${escapedCode}</code></pre>`;
        }
        
        // Headings
        if (trimmedBlock.startsWith('### ')) return `<h3>${processInline(trimmedBlock.substring(4))}</h3>`;
        if (trimmedBlock.startsWith('## ')) return `<h2>${processInline(trimmedBlock.substring(3))}</h2>`;
        if (trimmedBlock.startsWith('# ')) return `<h1>${processInline(trimmedBlock.substring(2))}</h1>`;

        // Lists
        if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ') || trimmedBlock.match(/^\d+\.\s/)) {
            const isOrdered = trimmedBlock.match(/^\d+\.\s/);
            const listTag = isOrdered ? 'ol' : 'ul';
            const items = trimmedBlock.split('\n').map(item => {
                let content = item.trim().replace(/^(\* |-\s|\d+\.\s)/, '');
                return `<li>${processInline(content)}</li>`;
            }).join('');
            return `<${listTag}>${items}</${listTag}>`;
        }

        // Paragraphs
        return `<p>${processInline(trimmedBlock)}</p>`;

    }).join('');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true">
      <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-[var(--brand-primary)]" />
            Interactive Simulation
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </header>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <h3 className="font-bold text-xl text-slate-700">{simulationContent.concept_link}</h3>
          <p className="text-sm text-slate-500 mb-4">{simulationContent.description}</p>
          
          {isLoading && (
            <div className="text-center p-8">
              <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[var(--brand-primary)] mx-auto"></div>
              <p className="mt-4 text-slate-500 font-semibold">Generating your interactive explanation...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
              <p>{error}</p>
            </div>
          )}
          
          {!isLoading && !error && explanation && (
             <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 prose prose-sm max-w-none prose-slate">
                {renderMarkdown(explanation)}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationExplainerModal;