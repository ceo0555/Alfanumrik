import React, { useState, useMemo } from 'react';
import { ArchitectIcon, SparklesIcon, ClipboardCopyIcon, CheckCircleIcon } from '../constants/icons';
import { generateLessonPackFromTopic } from '../services/geminiService';
import { LessonPack } from '../types';
import { curriculum } from '../constants/curriculum';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader';

const LessonArchitect: React.FC = () => {
    const { activeProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedPack, setGeneratedPack] = useState<LessonPack | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    // Form state
    const [grade, setGrade] = useState(activeProfile?.grade || '10');
    const [subject, setSubject] = useState(Object.keys(curriculum[grade as keyof typeof curriculum] || {})[0] || '');
    const [topic, setTopic] = useState('');

    const subjects = useMemo(() => Object.keys(curriculum[grade as keyof typeof curriculum] || {}), [grade]);
    
    React.useEffect(() => {
        setSubject(subjects[0] || '');
    }, [grade, subjects]);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic to generate a lesson pack.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedPack(null);

        try {
            const pack = await generateLessonPackFromTopic(grade, subject, topic);
            setGeneratedPack(pack);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyJson = () => {
        if (!generatedPack) return;
        navigator.clipboard.writeText(JSON.stringify(generatedPack, null, 2));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <ArchitectIcon className="w-6 h-6" /> AI Lesson Architect
            </h3>
            <p className="text-slate-500 mb-6">Generate a complete, pedagogically sound, and CBSE-aligned lesson pack from a simple topic.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="space-y-4">
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
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Topic</label>
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Photosynthesis" className="form-input w-full" />
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary w-full flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Generating...' : 'Generate Lesson Pack'}
                    </button>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                
                {/* Output Display */}
                <div className="p-4 bg-slate-50 rounded-lg border">
                    <h4 className="font-bold text-lg mb-4 text-center">Generated Content</h4>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                           <Loader />
                        </div>
                    )}
                    {generatedPack && (
                        <div className="space-y-4 animate-fade-in">
                            <h5 className="font-bold text-xl text-indigo-700">{generatedPack.topic_name}</h5>
                            <div className="text-sm space-y-2 bg-white p-3 rounded-md border">
                                <p><strong>Core Explanations:</strong> {generatedPack.student_explanation.core_explanation.length} blocks</p>
                                <p><strong>Worked Examples:</strong> {generatedPack.student_explanation.worked_examples.length}</p>
                                <p><strong>Assessment Questions:</strong> {generatedPack.assessment_blueprint.question_pool.length}</p>
                                <p><strong>Teacher Notes:</strong> {Object.keys(generatedPack.teacher_notes).length} sections</p>
                            </div>
                            <button onClick={handleCopyJson} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center justify-center gap-2">
                                {isCopied ? <CheckCircleIcon className="w-5 h-5 text-green-600"/> : <ClipboardCopyIcon className="w-5 h-5" />}
                                {isCopied ? 'Copied!' : 'Copy Lesson JSON'}
                            </button>
                        </div>
                    )}
                    {!isLoading && !generatedPack && (
                         <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <p className="text-sm text-center">Your generated lesson pack will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonArchitect;
