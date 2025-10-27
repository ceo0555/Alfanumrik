import React, { useState } from 'react';
import { QuestionPoolItem } from '../types';
import { generateCbeQuestion } from '../services/geminiService';
import { CBSE_COMPETENCIES, DOK_LEVELS } from '../constants/competencies';
import { curriculum } from '../constants/curriculum';
import { SparklesIcon, PlusIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';

interface CBEItemGeneratorProps {
    grade: string;
    onAddItemToBank: (item: QuestionPoolItem) => void;
}

const CBEItemGenerator: React.FC<CBEItemGeneratorProps> = ({ grade, onAddItemToBank }) => {
    const { handleUpdateItemBank, itemBank } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedItem, setGeneratedItem] = useState<QuestionPoolItem | null>(null);

    // Form state
    const [subject, setSubject] = useState(Object.keys(curriculum[grade as keyof typeof curriculum] || {})[0] || '');
    const [chapter, setChapter] = useState(curriculum[grade as keyof typeof curriculum]?.[subject]?.[0] || '');
    const [topic, setTopic] = useState('');
    const [type, setType] = useState<'MCQ' | 'SA' | 'Case'>('MCQ');
    const [competency, setCompetency] = useState(CBSE_COMPETENCIES[0]);
    const [dok, setDok] = useState<number>(2);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please specify a topic for the question.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedItem(null);
        try {
            const item = await generateCbeQuestion(grade, subject, chapter, type, competency, dok, topic);
            // Set status to pending for review
            setGeneratedItem({ ...item, status: 'pending' });
        } catch (err) {
            console.error(err);
            setError('Failed to generate question. The AI model might have returned an invalid format. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddToBank = () => {
        if (!generatedItem) return;
        handleUpdateItemBank([generatedItem, ...itemBank]);
        setGeneratedItem(null); // Clear after adding
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded-lg border space-y-4">
                <h3 className="font-bold text-lg">Item Generation Parameters</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Subject</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)} className="form-select w-full">
                            {Object.keys(curriculum[grade as keyof typeof curriculum] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Chapter</label>
                        <select value={chapter} onChange={e => setChapter(e.target.value)} className="form-select w-full">
                            {(curriculum[grade as keyof typeof curriculum]?.[subject] || []).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="form-label">Specific Topic</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Newton's First Law" className="form-input w-full" />
                </div>
                <div>
                    <label className="form-label">Question Type</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="form-select w-full">
                        <option value="MCQ">Multiple Choice Question</option>
                        <option value="SA">Short Answer</option>
                        <option value="Case">Case-based Question</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="form-label">Competency</label>
                        <select value={competency} onChange={e => setCompetency(e.target.value)} className="form-select w-full">
                            {CBSE_COMPETENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">DOK Level</label>
                        <select value={dok} onChange={e => setDok(Number(e.target.value))} className="form-select w-full">
                           {Object.entries(DOK_LEVELS).map(([val, lab]) => <option key={val} value={val}>{val}: {lab}</option>)}
                        </select>
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary w-full flex items-center justify-center gap-2">
                    <SparklesIcon className="w-5 h-5"/> {isLoading ? 'Generating...' : 'Generate Item'}
                </button>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border min-h-[300px] flex flex-col">
                <h3 className="font-bold text-lg mb-4">Generated Item</h3>
                {isLoading && <div className="m-auto text-center"><div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div><p className="mt-2 text-slate-500">Generating...</p></div>}
                {generatedItem && (
                    <div className="flex-grow space-y-3">
                         <div className="p-4 bg-white rounded-lg border">
                            <p className="font-semibold text-slate-800">{generatedItem.question}</p>
                            {generatedItem.source_passage && <p className="text-sm mt-2 p-2 bg-slate-100 rounded border italic">{generatedItem.source_passage}</p>}
                            {generatedItem.type === 'MCQ' && generatedItem.options && (
                                <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
                                    {generatedItem.options.map((opt, i) => <li key={i} className={opt === generatedItem.answer ? 'font-bold text-emerald-700' : ''}>{opt}</li>)}
                                </ul>
                            )}
                            {(generatedItem.type === 'SA' || generatedItem.type === 'LA') && <p className="text-sm mt-2 text-emerald-700 font-bold">Answer: {generatedItem.answer}</p>}
                            {generatedItem.sub_questions && generatedItem.sub_questions.map((sq, i) => (
                                <div key={sq.q_id} className="mt-2 pt-2 border-t">
                                    <p className="font-semibold text-sm">{i+1}. {sq.question}</p>
                                    <p className="text-xs mt-1 text-emerald-700 font-bold">Answer: {sq.answer}</p>
                                </div>
                            ))}
                            {generatedItem.distractor_rationale && <details className="text-xs mt-2"><summary className="cursor-pointer">View Distractor Rationale</summary><p className="p-2 bg-slate-100 rounded mt-1">{generatedItem.distractor_rationale}</p></details>}
                        </div>
                        <button onClick={handleAddToBank} className="btn w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2">
                            <PlusIcon className="w-4 h-4"/> Add to Bank (Pending Review)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CBEItemGenerator;