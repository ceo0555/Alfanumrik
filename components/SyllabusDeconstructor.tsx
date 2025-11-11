import React, { useState } from 'react';
import { NetworkIcon, SparklesIcon, ClipboardCopyIcon, CheckCircleIcon } from '../constants/icons';
import { deconstructSyllabus } from '../services/geminiService';
import { SyllabusUnit, PrerequisiteGraph } from '../types';
import Loader from './Loader';

interface DeconstructedSyllabus {
    structuredSyllabus: SyllabusUnit[];
    prerequisiteGraph: PrerequisiteGraph;
}

const SyllabusDeconstructor: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<DeconstructedSyllabus | null>(null);
    const [syllabusText, setSyllabusText] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!syllabusText.trim()) {
            setError('Please paste some syllabus text.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await deconstructSyllabus(syllabusText);
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyJson = () => {
        if (!result) return;
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <NetworkIcon className="w-6 h-6" /> AI Syllabus Deconstructor
            </h3>
            <p className="text-slate-500 mb-6">Paste raw syllabus text to transform it into structured JSON and a prerequisite dependency graph.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input */}
                <div className="space-y-4">
                    <textarea
                        value={syllabusText}
                        onChange={e => setSyllabusText(e.target.value)}
                        placeholder="Paste the unstructured syllabus text here..."
                        className="form-textarea w-full"
                        rows={15}
                        disabled={isLoading}
                    />
                    <button onClick={handleGenerate} disabled={isLoading} className="btn btn-primary w-full flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Deconstructing...' : 'Deconstruct Syllabus'}
                    </button>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                {/* Output */}
                <div className="p-4 bg-slate-50 rounded-lg border flex flex-col">
                    <h4 className="font-bold text-lg mb-2 text-center flex-shrink-0">Structured Output</h4>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full flex-grow">
                           <Loader />
                        </div>
                    )}
                    {result && (
                        <div className="flex-grow flex flex-col overflow-hidden animate-fade-in">
                           <div className="flex-grow overflow-y-auto bg-slate-900 text-white rounded-md p-3 text-xs font-mono">
                               <pre><code>{JSON.stringify(result, null, 2)}</code></pre>
                           </div>
                           <button onClick={handleCopyJson} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center justify-center gap-2 mt-2 flex-shrink-0">
                                {isCopied ? <CheckCircleIcon className="w-5 h-5 text-green-600"/> : <ClipboardCopyIcon className="w-5 h-5" />}
                                {isCopied ? 'Copied!' : 'Copy Full JSON'}
                            </button>
                        </div>
                    )}
                    {!isLoading && !result && (
                         <div className="flex flex-col items-center justify-center h-full flex-grow text-slate-400">
                            <p className="text-sm text-center">The generated JSON output will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SyllabusDeconstructor;
