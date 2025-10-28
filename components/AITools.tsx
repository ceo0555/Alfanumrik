import React, { useState } from 'react';
import { WandIcon, ClipboardCheckIcon, LightbulbIcon, LayersIcon, ImageIcon, EditIcon, VideoIcon } from '../constants/icons';
import ImageAnalyzer from './ImageAnalyzer';
import AdaptiveQuizGenerator from './AdaptiveQuizGenerator';
import ConceptExplainer from './ConceptExplainer';
import FlashcardViewer from './FlashcardViewer';
import ImageGenerator from './ImageGenerator';
import ImageEditor from './ImageEditor';
import VideoScriptGenerator from './VideoScriptGenerator';

type ActiveTool = 'concept-explainer' | 'image-analyze' | 'adaptive-quiz' | 'flashcards' | 'image-generator' | 'image-editor' | 'video-script';

const AITools: React.FC = () => {
    const [activeTool, setActiveTool] = useState<ActiveTool>('concept-explainer');

    const TabButton = ({ toolName, label, icon }: { toolName: ActiveTool, label: string, icon: React.ReactNode }) => {
        const isActive = activeTool === toolName;
        return (
            <button
                onClick={() => setActiveTool(toolName)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 font-semibold border-b-2 transition-colors text-sm ${
                    isActive
                        ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
            >
                {icon}
                <span>{label}</span>
            </button>
        );
    };

    const renderActiveTool = () => {
        switch (activeTool) {
            case 'concept-explainer':
                return <ConceptExplainer />;
            case 'image-analyze':
                return <ImageAnalyzer />;
            case 'adaptive-quiz':
                return <AdaptiveQuizGenerator />;
            case 'flashcards':
                return <FlashcardViewer />;
            case 'image-generator':
                return <ImageGenerator />;
            case 'image-editor':
                return <ImageEditor />;
            case 'video-script':
                return <VideoScriptGenerator />;
            default:
                return null;
        }
    };

    return (
        <div className="mx-auto animate-slide-in-up">
            <div className="mb-6 border-b border-slate-200">
                <div className="flex items-center -mb-px flex-nowrap md:flex-wrap overflow-x-auto">
                    <TabButton toolName="concept-explainer" label="Explainer" icon={<LightbulbIcon className="w-5 h-5" />} />
                    <TabButton toolName="flashcards" label="Flashcards" icon={<LayersIcon className="w-5 h-5" />} />
                    <TabButton toolName="adaptive-quiz" label="Adaptive Quiz" icon={<ClipboardCheckIcon className="w-5 h-5" />} />
                    <TabButton toolName="image-analyze" label="Image Q&A" icon={<WandIcon className="w-5 h-5" />} />
                    <TabButton toolName="image-generator" label="Image Gen" icon={<ImageIcon className="w-5 h-5" />} />
                    <TabButton toolName="image-editor" label="Image Editor" icon={<EditIcon className="w-5 h-5" />} />
                    <TabButton toolName="video-script" label="Video Script" icon={<VideoIcon className="w-5 h-5" />} />
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-[var(--border-color)] min-h-[400px]">
                {renderActiveTool()}
            </div>
        </div>
    );
};

export default AITools;
