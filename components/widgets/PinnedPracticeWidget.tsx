import React from 'react';
import { PinnedPracticeWidgetConfig, PracticeBlueprint } from '../../types';
import { TargetIcon, ArrowRightIcon, XIcon } from '../../constants/icons';
import { practiceBlueprints } from '../../constants/practiceBlueprints';

interface PinnedPracticeWidgetProps {
    widget: PinnedPracticeWidgetConfig;
    onStartPractice: (subject: string, blueprint: PracticeBlueprint) => void;
    onRemove: (id: string) => void;
}

const PinnedPracticeWidget: React.FC<PinnedPracticeWidgetProps> = ({ widget, onStartPractice, onRemove }) => {
    const { subject, blueprintId } = widget.data;
    const blueprint = practiceBlueprints.find(bp => bp.id === blueprintId);

    if (!blueprint) {
        return (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <p className="text-red-700 text-sm">Error: Practice set not found.</p>
                <button onClick={() => onRemove(widget.id)}>Remove</button>
            </div>
        );
    }
    
    const handleStart = () => {
        onStartPractice(subject, blueprint);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-red-100 rounded-full">
                    <TargetIcon className="w-5 h-5 text-red-600" />
                </div>
                <button onClick={() => onRemove(widget.id)} className="p-1 text-slate-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500">{subject}</p>
            <h4 className="font-bold text-slate-800 truncate">{blueprint.title}</h4>
            <button onClick={handleStart} className="btn btn-primary text-sm w-full mt-3 flex items-center justify-center gap-1">
                Start Practice <ArrowRightIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default PinnedPracticeWidget;