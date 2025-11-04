import React, { useState, useMemo } from 'react';
import { XIcon, ChevronDownIcon } from '../../constants/icons';
import { curriculum } from '../../constants/curriculum';

interface AddContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseGrade: string;
    onAddContent: (content: { id: string, name: string }[]) => void;
}

const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose, courseGrade, onAddContent }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedNames, setSelectedNames] = useState<Map<string, string>>(new Map());

    const chaptersBySubject = useMemo(() => {
        const subjects = curriculum[courseGrade as keyof typeof curriculum] || {};
        return Object.entries(subjects).map(([subject, chapters]) => ({
            subject,
            chapters: chapters.map(chapter => ({
                id: `G${courseGrade}-${subject}-${chapter}`,
                name: chapter,
            })),
        }));
    }, [courseGrade]);

    if (!isOpen) return null;

    const handleToggle = (id: string, name: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
                setSelectedNames(prevNames => {
                    const newMap = new Map(prevNames);
                    newMap.delete(id);
                    return newMap;
                });
            } else {
                newSet.add(id);
                setSelectedNames(prevNames => new Map(prevNames).set(id, name));
            }
            return newSet;
        });
    };

    const handleSave = () => {
        onAddContent(Array.from(selectedIds).map(id => ({ id, name: selectedNames.get(id)! })));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold">Add Content to Course</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                    {chaptersBySubject.map(({ subject, chapters }) => (
                        <details key={subject} className="group">
                            <summary className="cursor-pointer list-none flex justify-between items-center font-semibold p-2 rounded-md hover:bg-slate-100">
                                {subject}
                                <ChevronDownIcon className="w-4 h-4 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="pl-4 pt-2 space-y-2">
                                {chapters.map(chapter => (
                                    <label key={chapter.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(chapter.id)}
                                            onChange={() => handleToggle(chapter.id, chapter.name)}
                                            className="h-4 w-4 rounded"
                                        />
                                        <span className="text-sm">{chapter.name}</span>
                                    </label>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>

                <div className="mt-6 flex gap-4 flex-shrink-0">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary w-full">Add Selected ({selectedIds.size})</button>
                </div>
            </div>
        </div>
    );
};

export default AddContentModal;
