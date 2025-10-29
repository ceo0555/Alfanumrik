import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WidgetConfig, WidgetType } from '../types';
import { XIcon, TargetIcon, BookIcon, FileTextIcon, PlusIcon } from '../constants/icons';
import { curriculum } from '../constants/curriculum';
import { practiceBlueprints } from '../constants/practiceBlueprints';

interface AddWidgetModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen, onClose }) => {
    const { activeProfile, handleUpdateWidgets } = useAuth();
    const [selectedType, setSelectedType] = useState<'pinned_chapter' | 'pinned_practice' | 'quick_note' | null>(null);

    // Form state
    const [chapterInfo, setChapterInfo] = useState({ grade: activeProfile?.grade || '', subject: '', chapter: '' });
    const [practiceInfo, setPracticeInfo] = useState({ subject: '', blueprintId: '' });
    
    if (!isOpen || !activeProfile) return null;

    const subjects = Object.keys(curriculum[chapterInfo.grade as keyof typeof curriculum] || {});
    const chapters = curriculum[chapterInfo.grade as keyof typeof curriculum]?.[chapterInfo.subject] || [];
    
    // Auto-select first subject/chapter when grade changes
    React.useEffect(() => {
        if(subjects.length > 0) setChapterInfo(prev => ({...prev, subject: subjects[0]}));
    }, [chapterInfo.grade, subjects]);

    React.useEffect(() => {
        if(chapters.length > 0) setChapterInfo(prev => ({...prev, chapter: chapters[0]}));
    }, [chapterInfo.subject, chapters]);


    const handleAddWidget = () => {
        let newWidget: WidgetConfig | null = null;
        const id = `widget-${Date.now()}`;
        
        if (selectedType === 'pinned_chapter' && chapterInfo.chapter) {
            newWidget = { id, type: 'pinned_chapter', data: chapterInfo };
        } else if (selectedType === 'pinned_practice' && practiceInfo.blueprintId) {
            newWidget = { id, type: 'pinned_practice', data: practiceInfo };
        } else if (selectedType === 'quick_note') {
            newWidget = { id, type: 'quick_note', data: { content: '' } };
        }

        if (newWidget) {
            const currentWidgets = activeProfile.widgets || [];
            handleUpdateWidgets([...currentWidgets, newWidget]);
            onClose();
        }
    };
    
    const renderConfigForm = () => {
        switch(selectedType) {
            case 'pinned_chapter':
                return (
                    <div className="space-y-3 mt-4">
                        <select value={chapterInfo.grade} onChange={e => setChapterInfo({...chapterInfo, grade: e.target.value})} className="form-select w-full">
                            {Object.keys(curriculum).map(g => <option key={g} value={g}>Class {g}</option>)}
                        </select>
                        <select value={chapterInfo.subject} onChange={e => setChapterInfo({...chapterInfo, subject: e.target.value})} className="form-select w-full">
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={chapterInfo.chapter} onChange={e => setChapterInfo({...chapterInfo, chapter: e.target.value})} className="form-select w-full">
                            {chapters.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                );
            case 'pinned_practice':
                 return (
                    <div className="space-y-3 mt-4">
                        <select value={practiceInfo.subject} onChange={e => setPracticeInfo({...practiceInfo, subject: e.target.value})} className="form-select w-full">
                             <option value="">Select Subject</option>
                             {Object.keys(curriculum[activeProfile.grade as keyof typeof curriculum]).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={practiceInfo.blueprintId} onChange={e => setPracticeInfo({...practiceInfo, blueprintId: e.target.value})} className="form-select w-full">
                             <option value="">Select Practice Type</option>
                             {practiceBlueprints.map(bp => <option key={bp.id} value={bp.id}>{bp.title}</option>)}
                        </select>
                    </div>
                 );
            case 'quick_note':
                return <p className="text-sm text-slate-500 mt-4">A blank note will be added to your dashboard.</p>;
            default: return null;
        }
    }

    const isAddDisabled = (selectedType === 'pinned_chapter' && !chapterInfo.chapter) || (selectedType === 'pinned_practice' && !practiceInfo.blueprintId);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Add New Widget</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5"/></button>
                </div>
                
                {!selectedType ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button onClick={() => setSelectedType('pinned_chapter')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-center"><BookIcon className="w-8 h-8 mx-auto mb-2 text-indigo-500"/><span className="text-sm font-semibold">Pin Chapter</span></button>
                        <button onClick={() => setSelectedType('pinned_practice')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-center"><TargetIcon className="w-8 h-8 mx-auto mb-2 text-red-500"/><span className="text-sm font-semibold">Pin Practice</span></button>
                        <button onClick={() => setSelectedType('quick_note')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-center"><FileTextIcon className="w-8 h-8 mx-auto mb-2 text-yellow-500"/><span className="text-sm font-semibold">Quick Note</span></button>
                    </div>
                ) : (
                    <div>
                        {renderConfigForm()}
                        <div className="mt-6 flex gap-4">
                            <button onClick={() => setSelectedType(null)} className="btn w-full bg-slate-200">Back</button>
                            <button onClick={handleAddWidget} disabled={isAddDisabled} className="btn btn-primary w-full">Add Widget</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddWidgetModal;