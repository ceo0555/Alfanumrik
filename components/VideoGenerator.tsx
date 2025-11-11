import React, { useState, useEffect, useRef } from 'react';
import { VideoIcon, SparklesIcon, LoaderIcon, TriangleAlertIcon } from '../constants/icons';
import { generateVideoForConcept } from '../services/geminiService';
import Loader from './Loader';

const VideoGenerator: React.FC = () => {
    const [veoKeyState, setVeoKeyState] = useState<'unknown' | 'checking' | 'present' | 'absent'>('checking');
    const [prompt, setPrompt] = useState('');
    const [generationState, setGenerationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setVeoKeyState(hasKey ? 'present' : 'absent');
            } else {
                setVeoKeyState('absent');
                setError("AI Studio environment not detected. API key selection is disabled.");
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            setVeoKeyState('present');
            setError(null);
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate a video.');
            return;
        }

        setGenerationState('loading');
        setError(null);
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
            setVideoUrl(null);
        }

        try {
            const url = await generateVideoForConcept(prompt);
            setVideoUrl(url);
            setGenerationState('success');
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.message || 'An unknown error occurred during video generation.';
            
            if (errorMessage.includes("Requested entity was not found.")) {
                setError("Your API key may be invalid or lack permissions for the Veo model. Please select a valid key and ensure billing is enabled.");
                setVeoKeyState('absent');
            } else {
                setError(errorMessage);
            }
            setGenerationState('error');
        }
    };

    const renderContent = () => {
        if (generationState === 'loading') {
            return (
                <div className="text-center p-8">
                    <Loader />
                    <p className="text-xs text-slate-400 mt-1">Video generation can take several minutes.</p>
                </div>
            );
        }
        if (generationState === 'success' && videoUrl) {
            return (
                <div>
                    <video src={videoUrl} controls autoPlay className="w-full rounded-lg bg-black" />
                    <button onClick={() => { setGenerationState('idle'); setPrompt(''); }} className="btn btn-primary w-full mt-4">Generate Another Video</button>
                </div>
            );
        }
        if (generationState === 'error') {
             return (
                 <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
                    <p className="font-semibold">Generation Failed</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button onClick={handleGenerate} className="btn bg-red-600 hover:bg-red-700 text-white mt-4">Try Again</button>
                </div>
             );
        }

        return <p className="text-slate-400 text-center">Your generated video will appear here.</p>;
    };

    if (veoKeyState === 'checking') {
        return <div className="text-center p-8"><LoaderIcon className="w-8 h-8 mx-auto animate-spin"/></div>;
    }

    if (veoKeyState === 'absent') {
        return (
            <div className="text-center p-8 bg-slate-50 rounded-lg">
                <TriangleAlertIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3"/>
                <h3 className="font-bold text-lg text-slate-800">API Key Required for Veo</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                    Video generation requires you to select your own API key. Please ensure your key has billing enabled to use the Veo model.
                </p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline mt-1 block">Learn about billing</a>
                <button onClick={handleSelectKey} className="btn btn-primary mt-4">
                    Select API Key
                </button>
                 {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </div>
        );
    }
    
    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">AI Video Generator</h3>
            <p className="text-slate-500 mb-6">Describe a short, educational video you want to create. Be descriptive for the best results.</p>

            <div className="flex flex-col gap-4">
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g., A 30-second, simple animated educational video explaining the Calvin Cycle..."
                    className="form-textarea w-full"
                    rows={4}
                    disabled={generationState === 'loading'}
                />
                <button onClick={handleGenerate} disabled={!prompt.trim() || generationState === 'loading'} className="btn btn-primary flex items-center justify-center gap-2">
                    <SparklesIcon className="w-5 h-5"/> Generate Video
                </button>
            </div>
            
            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default VideoGenerator;
