import React, { useState, useEffect } from 'react';
import { QuickNoteWidgetConfig } from '../../types';
import { FileTextIcon, XIcon } from '../../constants/icons';

interface QuickNoteWidgetProps {
    widget: QuickNoteWidgetConfig;
    onUpdate: (id: string, data: { content: string }) => void;
    onRemove: (id: string) => void;
}

const QuickNoteWidget: React.FC<QuickNoteWidgetProps> = ({ widget, onUpdate, onRemove }) => {
    const [note, setNote] = useState(widget.data.content || '');

    // Debounce saving
    useEffect(() => {
        const handler = setTimeout(() => {
            if (note !== widget.data.content) {
                onUpdate(widget.id, { content: note });
            }
        }, 500); // Save 500ms after user stops typing
        return () => clearTimeout(handler);
    }, [note, widget.id, widget.data.content, onUpdate]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-100 rounded-full">
                        <FileTextIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h4 className="font-bold text-slate-800">Quick Note</h4>
                </div>
                <button onClick={() => onRemove(widget.id)} className="p-1 text-slate-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
            </div>
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Jot down a reminder..."
                className="w-full h-full flex-grow bg-yellow-50/50 rounded-lg p-2 text-sm border-0 focus:ring-1 focus:ring-yellow-400"
                rows={5}
            />
        </div>
    );
};

export default QuickNoteWidget;