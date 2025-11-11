import React from 'react';
import { InteractiveSimulationStep as InteractiveSimulationStepType, InteractiveSimulation } from '../types';
import { cleanText } from '../utils/textHelpers';
import { PlayIcon } from '../constants/icons';
import InteractiveReflectionDiagram from './InteractiveReflectionDiagram'; // Import the new component

interface InteractiveSimulationStepProps {
  content: InteractiveSimulationStepType['content'];
  onOpenSimulation: (content: InteractiveSimulation) => void;
}

const InteractiveSimulationStep: React.FC<InteractiveSimulationStepProps> = ({ content, onOpenSimulation }) => {
  // Check if this simulation is for the reflection of light
  const isReflectionSimulation = content.concept_link.toLowerCase().includes('reflection');

  return (
    <div className="p-4 border-l-4 border-cyan-500 bg-cyan-50 rounded-r-lg">
      <h3 className="font-bold text-lg text-cyan-800 flex items-center gap-2">
        <PlayIcon className="w-6 h-6" /> Interactive Simulation
      </h3>
      
      {isReflectionSimulation ? (
        <InteractiveReflectionDiagram />
      ) : (
        <div className="mt-4 text-center p-6 bg-white border-2 border-dashed border-cyan-200 rounded-lg shadow-inner">
          <p className="text-slate-700 mb-4 text-md">{cleanText(content.description)}</p>
          <div className="p-3 bg-cyan-100 rounded-md">
            <p className="text-sm font-semibold text-cyan-800">
              Concept: <span className="font-bold">{cleanText(content.concept_link)}</span>
            </p>
          </div>
          <button 
            onClick={() => onOpenSimulation(content)}
            className="mt-5 btn btn-primary bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2 w-full sm:w-auto mx-auto"
          >
            Explore Simulation
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractiveSimulationStep;
