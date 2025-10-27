import React, { useState, useEffect } from 'react';
import { PaperBlueprint, BlueprintSection } from '../types';
import { PlusIcon, XIcon, FileTextIcon } from '../constants/icons';
import { curriculum } from '../constants/curriculum';

interface BlueprintEditorProps {
    grade: string;
    blueprints: PaperBlueprint[];
    onSaveBlueprint: (blueprint: PaperBlueprint) => void;
    onAssemblePaper: (blueprint: PaperBlueprint) => void;
}

const BlueprintEditor: React.FC<BlueprintEditorProps> = ({ grade, blueprints, onSaveBlueprint, onAssemblePaper }) => {
    const [selectedBlueprint, setSelectedBlueprint] = useState<PaperBlueprint | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [competencyWeightage, setCompetencyWeightage] = useState(50);
    const [sections, setSections] = useState<BlueprintSection[]>([]);

    useEffect(() => {
        setSubject(Object.keys(curriculum[grade as keyof typeof curriculum] || {})[0] || '');
    }, [grade]);
    
    useEffect(() => {
        if (selectedBlueprint) {
            setName(selectedBlueprint.name);
            setSubject(selectedBlueprint.subject);
            setCompetencyWeightage(selectedBlueprint.competencyWeightage);
            setSections(selectedBlueprint.sections);
            setIsEditing(true);
        } else {
            resetForm();
        }
    }, [selectedBlueprint]);

    const resetForm = () => {
        setName('');
        setCompetencyWeightage(50);
        setSections([]);
        setIsEditing(false);
        setSelectedBlueprint(null);
    };

    const handleAddSection = () => {
        const newSection: BlueprintSection = {
            id: `sec-${Date.now()}`,
            name: `Section ${String.fromCharCode(65 + sections.length)}`,
            questionType: 'MCQ',
            questions: 5,
            marksPerQuestion: 1,
        };
        setSections(prev => [...prev, newSection]);
    };

    const handleRemoveSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    const handleSectionChange = (id: string, field: keyof BlueprintSection, value: string | number) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const totalMarks = sections.reduce((acc, sec) => acc + sec.questions * sec.marksPerQuestion, 0);

    const handleSave = () => {
        const blueprint: PaperBlueprint = {
            id: selectedBlueprint?.id || `bp-${Date.now()}`,
            name,
            grade,
            subject,
            totalMarks,
            competencyWeightage,
            sections,
        };
        onSaveBlueprint(blueprint);
        resetForm();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <h3 className="font-bold text-lg mb-2">My Blueprints</h3>
                <div className="space-y-2">
                    {blueprints.filter(b => b.grade === grade).map(bp => (
                        <button key={bp.id} onClick={() => setSelectedBlueprint(bp)} className={`w-full text-left p-3 rounded-md border ${selectedBlueprint?.id === bp.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-slate-50'}`}>
                            <p className="font-semibold">{bp.name}</p>
                            <p className="text-xs text-slate-500">{bp.subject} | {bp.totalMarks} Marks</p>
                        </button>
                    ))}
                    <button onClick={resetForm} className="w-full text-center p-3 rounded-md border-2 border-dashed hover:bg-slate-50 font-semibold text-slate-600">
                        + Create New Blueprint
                    </button>
                </div>
            </div>

            <div className="md:col-span-2 p-4 bg-white rounded-lg border">
                <h3 className="font-bold text-lg mb-4">{isEditing ? 'Edit Blueprint' : 'Create New Blueprint'}</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Blueprint Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input w-full" placeholder="e.g., Mid-Term Exam" />
                        </div>
                         <div>
                            <label className="form-label">Subject</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} className="form-select w-full">
                                {Object.keys(curriculum[grade as keyof typeof curriculum] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                     <div>
                        <label className="form-label">Competency-based Weightage: <span className="font-bold">{competencyWeightage}%</span></label>
                        <input type="range" min="0" max="100" step="5" value={competencyWeightage} onChange={e => setCompetencyWeightage(Number(e.target.value))} className="w-full" />
                        <p className="text-xs text-slate-500">Aligns with CBSE goal of {grade === '11' || grade === '12' ? '50%' : '40%'} competency questions for classes IX-XII.</p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Sections</h4>
                        <div className="space-y-3">
                            {sections.map(sec => (
                                <div key={sec.id} className="grid grid-cols-10 gap-2 items-center p-2 bg-slate-50 rounded">
                                    <input type="text" value={sec.name} onChange={e => handleSectionChange(sec.id, 'name', e.target.value)} className="form-input col-span-3 text-sm" />
                                    <select value={sec.questionType} onChange={e => handleSectionChange(sec.id, 'questionType', e.target.value)} className="form-select col-span-2 text-sm">
                                        <option value="MCQ">MCQ</option><option value="SA">SA</option><option value="LA">LA</option><option value="Case">Case</option>
                                    </select>
                                    <input type="number" value={sec.questions} onChange={e => handleSectionChange(sec.id, 'questions', Number(e.target.value))} className="form-input col-span-2 text-sm" />
                                    <span className="text-center text-sm">x</span>
                                    <input type="number" value={sec.marksPerQuestion} onChange={e => handleSectionChange(sec.id, 'marksPerQuestion', Number(e.target.value))} className="form-input col-span-1 text-sm" />
                                    <button onClick={() => handleRemoveSection(sec.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full col-span-1"><XIcon className="w-4 h-4 mx-auto"/></button>
                                </div>
                            ))}
                            <button onClick={handleAddSection} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm"><PlusIcon className="w-4 h-4 mr-1"/> Add Section</button>
                        </div>
                    </div>
                    
                    <div className="p-3 bg-indigo-50 rounded-md text-right">
                        <span className="font-bold text-lg">Total Marks: {totalMarks}</span>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={handleSave} className="btn btn-primary w-full">{isEditing ? 'Update Blueprint' : 'Save Blueprint'}</button>
                        <button onClick={() => selectedBlueprint && onAssemblePaper(selectedBlueprint)} disabled={!isEditing} className="btn bg-emerald-600 hover:bg-emerald-700 text-white w-full flex items-center justify-center gap-2">
                           <FileTextIcon className="w-5 h-5"/> Assemble Paper
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlueprintEditor;
