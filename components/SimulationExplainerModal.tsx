import React, { useState, useEffect } from 'react';
import { InteractiveSimulation } from '../types';
import { generateSimulationExplanation } from '../services/geminiService';
import { XIcon, SparklesIcon } from '../constants/icons';
import MarkdownRenderer from './MarkdownRenderer';

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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} aria-modal="true">
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
                <MarkdownRenderer content={explanation} />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationExplainerModal;