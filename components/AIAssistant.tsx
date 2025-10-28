import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage, Modality } from '@google/genai';
import { MicrophoneIcon, StopIcon, SparklesIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import { useLiveAudio } from '../utils/useLiveAudio';
import { decode, decodeAudioData } from '../utils/audio';

const AIAssistant: React.FC = () => {
    const { activeProfile } = useAuth();
    const [transcriptionHistory, setTranscriptionHistory] = useState<{ speaker: 'user' | 'model', text: string }[]>([]);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    
    // Refs for audio playback management
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const studentName = activeProfile?.name || 'Student';
    const currentGrade = activeProfile?.grade || 'your grade';

    const systemInstruction = `You are MIGA, a friendly and encouraging AI tutor for a K-12 student named ${studentName}. Your primary goal is to help them understand concepts from any of their school subjects, not just give answers.

        **Student's Context**:
        - Grade: ${currentGrade}
        - Curriculum: CBSE (India)

        **Key instructions**:
        1.  **Multilingual Support**: You MUST detect the language ${studentName} is speaking (e.g., English, Hindi, Hinglish). You MUST respond in the exact same language. Do not translate unless explicitly asked.
        2.  **Personalization**: Always address the student as ${studentName}.
        3.  **General Expert**: Act as an expert across all of the student's subjects (like Science, Maths, Social Studies, etc.) for their grade level.
        4.  **Pedagogical Approach & Mathematical Accuracy**:
            - For subjective/theory questions: Explain concepts step-by-step using simple language, analogies, and real-world examples. Your spoken response and the transcription should be plain text without any special formatting characters.
            - For numerical/problem-solving questions: You must be 100% accurate. Before responding, think step-by-step to deconstruct the problem, identify correct formulas, perform calculations carefully, and double-check your work. Guide ${studentName} through these verified steps. Do not give the final answer away, but ensure every step you provide is mathematically sound.
        5.  **Tone**: Be patient, positive, and encouraging. Keep your answers concise and easy to follow.
        6.  **Educational Focus**: Your purpose is to help with educational topics. If the query is unrelated to academics, school subjects, or learning, you must politely decline to answer and explain that your role is to assist with educational questions.`;

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        // --- Transcription Logic ---
        if (message.serverContent?.outputTranscription) {
            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
        } else if (message.serverContent?.inputTranscription) {
            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
        }

        // --- Audio Playback Logic ---
        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64EncodedAudioString && outputAudioContextRef.current) {
            const context = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, context.currentTime);

            const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                context,
                24000, // Sample rate for Gemini Live audio output
                1      // Mono channel
            );

            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            
            const sources = audioSourcesRef.current;
            source.addEventListener('ended', () => {
                sources.delete(source);
            });

            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sources.add(source);
        }

        // --- Interruption Handling ---
        if (message.serverContent?.interrupted) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
                audioSourcesRef.current.delete(source);
            }
            nextStartTimeRef.current = 0;
        }

        // --- Turn Completion Logic ---
        if (message.serverContent?.turnComplete) {
            const fullInput = currentInputTranscriptionRef.current.trim();
            const fullOutput = currentOutputTranscriptionRef.current.trim();
            setTranscriptionHistory(prev => {
                const newHistory = [...prev];
                if (fullInput) newHistory.push({ speaker: 'user', text: fullInput });
                if (fullOutput) newHistory.push({ speaker: 'model', text: fullOutput });
                return newHistory;
            });
            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
        }
    }, []);

    const { isSessionActive, status, startConversation, stopConversation } = useLiveAudio({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingBudget: 24576 } // Max budget for deep reasoning on Flash models
        },
    }, { onmessage: handleMessage });

    const handleStart = () => {
        setTranscriptionHistory([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
        
        // Initialize audio context for playback
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;
        audioSourcesRef.current.clear();

        startConversation();
    };

    const handleStop = useCallback(() => {
        stopConversation();
        // Cleanup audio resources
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
        for (const source of audioSourcesRef.current.values()) {
            try { source.stop(); } catch(e) {/* ignore errors if already stopped */}
        }
        audioSourcesRef.current.clear();
    }, [stopConversation]);

    const handleToggleConversation = () => {
        if (isSessionActive) {
            handleStop();
        } else {
            handleStart();
        }
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handleStop();
        };
    }, [handleStop]);

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full animate-slide-in-up">
            <div className="flex-grow bg-white border border-[var(--border-color)] rounded-xl shadow-sm p-4 overflow-y-auto mb-6">
                {transcriptionHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                        <SparklesIcon className="w-16 h-16 mb-4"/>
                        <p className="font-semibold text-slate-600">MIGA is ready to help.</p>
                        <p className="text-sm">The conversation transcript will appear here.</p>
                    </div>
                )}
                <div className="space-y-4">
                    {transcriptionHistory.map((entry, index) => (
                        <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                            {entry.speaker === 'model' && <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold flex-shrink-0">M</div>}
                            <div className={`max-w-lg p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-slate-100 text-slate-800' : 'bg-indigo-50 text-slate-700'}`}>
                                <p>{entry.text}</p>
                            </div>
                            {entry.speaker === 'user' && <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold flex-shrink-0">{studentName.charAt(0)}</div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 text-center">
                <p className="text-slate-600 font-semibold mb-3">Hi, {studentName}! Ask me anything about your subjects.</p>
                <button
                    onClick={handleToggleConversation}
                    className={`p-4 rounded-full transition-all duration-300 text-white shadow-lg transform hover:scale-110 ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]'} disabled:bg-slate-300 disabled:cursor-not-allowed`}
                    aria-label={isSessionActive ? 'Stop conversation' : 'Start conversation'}
                >
                    {isSessionActive ? <StopIcon className="w-8 h-8" /> : <MicrophoneIcon className="w-8 h-8" />}
                </button>
                <p className="text-slate-500 mt-3 text-sm h-5">{status}</p>
            </div>
        </div>
    );
};

export default AIAssistant;