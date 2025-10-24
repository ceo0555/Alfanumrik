import React, { useState } from 'react';
import { VideoIcon, SparklesIcon, ClipboardCopyIcon, CheckCircleIcon } from '../constants/icons';
import { generateVideoScriptWithQuestions } from '../services/geminiService';
import { InteractiveVideo } from '../types';

const VideoScriptGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<InteractiveVideo | null>(null);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError("Please enter a topic for the video script.");
            return;
        }
        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            const scriptData = await generateVideoScriptWithQuestions(topic);
            setResult(scriptData);
        } catch (err) {
            console.error(err);
            setError("Sorry, an error occurred while generating the video script. Please try again.");
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
            <h3 className="text-xl font-bold text-slate-800 mb-2">AI Video Script Generator</h3>
            <p className="text-slate-500 mb-6">Enter a topic and MIGA will create a script for an interactive video lesson, complete with questions.</p>

            <div className="flex flex-col gap-4">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'The process of photosynthesis'"
                    className="form-input w-full p-3 text-base"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !topic.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Generating Script...' : <><SparklesIcon className="w-5 h-5" /> Generate Script</>}
                </button>
            </div>

            {error && <p className="mt-4 text-red-500">{error}</p>}

            {isLoading && (
                <div className="mt-6 text-center p-8">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-500">MIGA is writing your script...</p>
                </div>
            )}

            {result && (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-left">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <VideoIcon className="w-5 h-5 text-indigo-500" />
                            Generated Script: {result.title}
                        </h4>
                        <button onClick={handleCopy} className="p-2 rounded-md bg-slate-200 hover:bg-slate-300 transition-colors">
                            {isCopied ? <CheckCircleIcon className="w-5 h-5 text-emerald-600" /> : <ClipboardCopyIcon className="w-5 h-5 text-slate-600" />}
                        </button>
                    </div>
                    <pre className="w-full bg-slate-900 text-white p-4 rounded-md text-xs overflow-x-auto max-h-80">
                        <code>{JSON.stringify(result, null, 2)}</code>
                    </pre>
                     {isCopied && <div className="text-right text-xs mt-1 font-semibold text-emerald-600">Copied to clipboard!</div>}
                </div>
            )}
        </div>
    );
};

export default VideoScriptGenerator;