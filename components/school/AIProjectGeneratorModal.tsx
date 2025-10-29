import React, { useState } from 'react';
import { XIcon, SparklesIcon } from '../../constants/icons';
import { CrossCurricularProject } from '../../types';
import { generateCrossCurricularProjectIdea } from '../../services/geminiService';
import { curriculum } from '../../constants/curriculum';

interface AIProjectGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddProject: (projectData: Omit<CrossCurricularProject, 'id' | 'evidence'>) => void;
}

const AIProjectGeneratorModal: React.FC<AIProjectGeneratorModalProps> = ({ isOpen, onClose, onAddProject }) => {
    const [grade, setGrade] = useState('8');
    const [subject, setSubject] = useState('Science');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedProject, setGeneratedProject] = useState<Omit<CrossCurricularProject, 'id' | 'evidence'> | null>(null);
    
    if (!isOpen) return null;

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setGeneratedProject(null);
        try {
            const projectData = await generateCrossCurricularProjectIdea(grade, subject);
            setGeneratedProject(projectData);
        } catch (err) {
            console.error(err);
            setError('Failed to generate project idea. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAdd = () => {
        if (generatedProject) {
            onAddProject(generatedProject);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-6 pb-4 border-b flex-shrink-0 flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> AI Project Idea Generator</h3>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5"/></button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Grade</label>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className="form-select w-full">
                                {Object.keys(curriculum).map(g => <option key={g} value={g}>Class {g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Subject</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} className="form-select w-full">
                                {Object.keys(curriculum[grade as keyof typeof curriculum] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary w-full mt-4">
                        {isLoading ? 'Generating...' : 'Generate Idea'}
                    </button>
                    
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    
                    {isLoading && (
                        <div className="mt-4 text-center">
                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div>
                            <p className="mt-2 text-slate-500">Generating...</p>
                        </div>
                    )}
                    
                    {generatedProject && (
                        <div className="mt-4 p-4 bg-slate-50 border rounded-lg space-y-2 animate-fade-in">
                            <h4 className="font-bold">{generatedProject.title}</h4>
                            <p className="text-sm">{generatedProject.description}</p>
                            <div><h5 className="font-semibold text-sm">Objectives:</h5><ul className="list-disc list-inside text-xs">{generatedProject.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul></div>
                            <div><h5 className="font-semibold text-sm">Tasks:</h5><ul className="list-disc list-inside text-xs">{generatedProject.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                        </div>
                    )}
                </div>
                
                <footer className="p-6 pt-4 border-t flex-shrink-0 flex gap-4">
                    <button onClick={onClose} className="btn w-full bg-slate-200">Cancel</button>
                    <button onClick={handleAdd} disabled={!generatedProject} className="btn btn-primary w-full">Add to Library</button>
                </footer>
            </div>
        </div>
    );
};

export default AIProjectGeneratorModal;