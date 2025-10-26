import React, { useState } from 'react';
import { curriculum } from '../constants/curriculum';
import { generatePrerequisiteGraph } from '../services/geminiService';
import { PrerequisiteGraph } from '../types';
import { ClipboardCopyIcon, CheckCircleIcon } from '../constants/icons';

const PrereqGenerator: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [result, setResult] = useState<PrerequisiteGraph | null>(null);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setProgress('Starting generation...');
        setResult(null);
        setError('');
        const fullGraph: PrerequisiteGraph = {};

        try {
            for (const grade in curriculum) {
                for (const subject in curriculum[grade as keyof typeof curriculum]) {
                    setProgress(`Generating for Class ${grade} - ${subject}...`);
                    const chapters = curriculum[grade as keyof typeof curriculum][subject as keyof typeof curriculum[keyof typeof curriculum]];
                    const graphPart = await generatePrerequisiteGraph(grade, subject, chapters);
                    Object.assign(fullGraph, graphPart);
                }
            }
            setResult(fullGraph);
            setProgress('Generation complete!');
        } catch (err) {
            console.error(err);
            setError('An error occurred during generation. Check the console for details.');
            setProgress('Generation failed.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Prerequisite Graph Generator</h3>
            <p className="text-slate-500 mb-6">This tool uses AI to generate the prerequisite relationships for all chapters in the curriculum.</p>

            <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary">
                {isLoading ? 'Generating...' : 'Start Generation'}
            </button>
            
            {(isLoading || progress) && <p className="mt-4 text-slate-500 font-semibold">{progress}</p>}
            {error && <p className="mt-2 text-red-500">{error}</p>}
            
            {result && (
                <div className="mt-6 text-left relative">
                    <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white">
                        {isCopied ? <CheckCircleIcon className="w-5 h-5"/> : <ClipboardCopyIcon className="w-5 h-5"/>}
                    </button>
                    <pre className="w-full bg-slate-900 text-white p-4 rounded-md text-xs overflow-x-auto max-h-96">
                        <code>{JSON.stringify(result, null, 2)}</code>
                    </pre>
                    {isCopied && <div className="text-right text-xs mt-1 font-semibold text-emerald-600">Copied to clipboard!</div>}
                    <p className="mt-2 text-sm text-slate-600">Copy this JSON and paste it into <code className="bg-slate-200 p-1 rounded">src/constants/prerequisites.ts</code>.</p>
                </div>
            )}
        </div>
    );
};

export default PrereqGenerator;
