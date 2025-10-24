

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage } from '@google/genai';
import { MicrophoneIcon, StopIcon } from '../constants/icons';
import { useLiveAudio } from '../utils/useLiveAudio';

const AudioTranscriber: React.FC = () => {
    const [transcription, setTranscription] = useState('');
    const transcriptionRef = useRef('');

    const systemInstruction = `You are a highly accurate audio transcription service for a student. Your sole purpose is to transcribe the user's speech into text. Do not respond, answer, or engage in conversation. Only provide the transcription. The topic is related to school subjects.`;

    const handleMessage = useCallback((message: LiveServerMessage) => {
        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            transcriptionRef.current += text;
            setTranscription(transcriptionRef.current);
        }
    }, []);

    const { isSessionActive, status, startConversation, stopConversation } = useLiveAudio({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            inputAudioTranscription: {},
            systemInstruction: systemInstruction,
        },
    }, { onmessage: handleMessage });

    const handleStart = () => {
        setTranscription('');
        transcriptionRef.current = '';
        startConversation();
    };

    const handleToggleRecording = () => {
        if (isSessionActive) {
            stopConversation();
        } else {
            handleStart();
        }
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => stopConversation();
    }, [stopConversation]);

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Audio Transcriber</h3>
            <p className="text-slate-500 mb-6">Record your voice to get a text transcription. Useful for practicing pronunciation or taking voice notes.</p>
            
            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={handleToggleRecording}
                    className={`p-4 rounded-full transition-colors text-white ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    aria-label={isSessionActive ? 'Stop recording' : 'Start recording'}
                >
                    {isSessionActive ? <StopIcon className="w-8 h-8" /> : <MicrophoneIcon className="w-8 h-8" />}
                </button>
                <p className="text-slate-500 text-sm h-5">{status}</p>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-left min-h-[120px]">
                    <p className="text-slate-700">{transcription || 'Transcription will appear here...'}</p>
                </div>
            </div>
        </div>
    );
};

export default AudioTranscriber;