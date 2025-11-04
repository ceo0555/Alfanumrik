import React from 'react';
import { CheckCircleIcon } from '../../constants/icons';

interface WorkflowStepProps {
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ title, description, isActive, isCompleted }) => (
    <div className={`relative pl-8 py-2 transition-opacity duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-50'}`}>
        <div className={`absolute top-3 left-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-indigo-500 border-indigo-500' : isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}>
            {isCompleted && <CheckCircleIcon className="w-5 h-5 text-white fill-emerald-500" />}
        </div>
        <h5 className={`font-bold ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}>{title}</h5>
        <p className="text-xs text-slate-500">{description}</p>
    </div>
);


interface WorkflowDiagramProps {
    steps: { title: string; description: string }[];
    activeStep: number;
}

const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ steps, activeStep }) => {
    return (
        <div className="relative">
            {/* Timeline Bar */}
            <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
            {steps.map((step, index) => (
                <WorkflowStep
                    key={index}
                    title={step.title}
                    description={step.description}
                    isActive={index === activeStep}
                    isCompleted={index < activeStep}
                />
            ))}
        </div>
    );
};

export default WorkflowDiagram;
