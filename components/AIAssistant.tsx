import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Chat, GenerateContentResponse, GroundingChunk } from '@google/genai';
import { MicrophoneIcon, StopIcon, SparklesIcon, XIcon, MessageSquareIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import { useLiveAudio } from '../utils/useLiveAudio';
import { decode, decodeAudioData } from '../utils/audio';
import { ChatMessage, UserDktData, DktSkillState, TutorInterventionContext, QuestionPoolItem, QuickCheck } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { getGeminiApiKey } from '../utils/env';


// --- Text Chat Component (adapted from TutorCore) ---
const ThinkingBubble = () => (
    <div className="flex items-center gap-1.5 p-2">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
    </div>
);


const TextTutorView: React.FC<{ systemInstruction: string }> = ({ systemInstruction }) => {
    const { activeProfile } = useAuth();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const apiKey = getGeminiApiKey();
        if (apiKey && activeProfile) {
            const ai = new GoogleGenAI({ apiKey });
            const chatInstance = ai.chats.create({
                model: 'gemini-2.5-pro',
                config: {
                    systemInstruction,
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: { thinkingBudget: 32768 }
                },
            });
            setChat(chatInstance);
            setMessages([]);
        } else if (!apiKey) {
            setError("Gemini API key is not configured. This feature is disabled.");
        }
    }, [activeProfile, systemInstruction]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const thinkingMessage: ChatMessage = { role: 'model', content: '', status: 'generating' };

        setMessages(prev => [...prev, userMessage, thinkingMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const responseStream = await chat.sendMessageStream({ message: input });
            
            let modelResponse = '';
            const sourceMap = new Map<string, GroundingChunk>();

            for await (const chunk of responseStream) {
                modelResponse += chunk.text;
                
                const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks) {
                    for (const gc of groundingChunks) {
                        if (gc.web?.uri && !sourceMap.has(gc.web.uri)) {
                            sourceMap.set(gc.web.uri, gc);
                        }
                    }
                }
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                      lastMessage.content = modelResponse;
                    }
                    return newMessages;
                });
            }

             setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.status = 'done';
                    lastMessage.sources = Array.from(sourceMap.values());
                }
                return newMessages;
            });

        } catch (err) {
            console.error(err);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                 if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.content = errorMessage;
                    lastMessage.status = 'done';
                } else {
                    updatedMessages.push({ role: 'model', content: errorMessage, status: 'done' });
                }
                return updatedMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex-grow flex flex-col overflow-hidden">
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                        <SparklesIcon className="w-16 h-16 mb-4"/>
                        <p>Ask me anything about your subjects! For example, "Can you explain photosynthesis?"</p>
                    </div>
                )}
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                         <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">A</div>}
                            <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-slate-100 text-slate-800' : 'bg-indigo-50 text-slate-700'}`}>
                                {msg.status === 'generating' && !msg.content ? <ThinkingBubble /> : <div className="prose prose-sm max-w-none prose-indigo"><MarkdownRenderer content={msg.content} /></div>}
                            </div>
                            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold flex-shrink-0">{activeProfile?.name.charAt(0)}</div>}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            {error && <div className="p-2 text-center text-sm text-red-600 bg-red-50">{error}</div>}
            <div className="p-4 border-t border-[var(--border-color)]">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question here..."
                        disabled={isLoading || !chat}
                        className="form-input w-full px-4 py-2 text-base"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !chat}
                        className="btn btn-primary px-6 py-2"
                    >
                        {isLoading ? ( <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div> ) : ( "Ask" )}
                    </button>
                </form>
            </div>
        </div>
    );
};


// --- Live Tutor Component (adapted from original AIAssistant) ---

const LiveTutorView: React.FC<{ systemInstruction: string; studentName: string; }> = ({ systemInstruction, studentName }) => {
    const [transcriptionHistory, setTranscriptionHistory] = useState<{ speaker: 'user' | 'model', text: string }[]>([]);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
        else if (message.serverContent?.inputTranscription) currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;

        const modelTurnParts = message.serverContent?.modelTurn?.parts ?? [];
        const base64EncodedAudioString = modelTurnParts[0]?.inlineData?.data;
        if (base64EncodedAudioString && outputAudioContextRef.current) {
            const context = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, context.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), context, 24000, 1);
            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            const sources = audioSourcesRef.current;
            source.addEventListener('ended', () => { sources.delete(source); });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sources.add(source);
        }

        if (message.serverContent?.interrupted) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
                audioSourcesRef.current.delete(source);
            }
            nextStartTimeRef.current = 0;
        }

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

    const { isSessionActive, status, startConversation, stopConversation, stream } = useLiveAudio({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingBudget: 24576 }
        },
    }, { onmessage: handleMessage });

    const handleStart = () => {
        setTranscriptionHistory([]);
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') outputAudioContextRef.current.close();
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;
        audioSourcesRef.current.clear();
        startConversation({ audio: true });
    };

    const handleStop = useCallback(() => {
        stopConversation();
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') outputAudioContextRef.current.close().catch(console.error);
        for (const source of audioSourcesRef.current.values()) { try { source.stop(); } catch(e) {} }
        audioSourcesRef.current.clear();
    }, [stopConversation]);

    useEffect(() => () => handleStop(), [handleStop]);
    
    useEffect(() => {
        let animationFrameId: number;
        if (!stream || !isSessionActive || !visualizerCanvasRef.current) {
            return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 128;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const canvas = visualizerCanvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const draw = () => {
            animationFrameId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = 'rgb(30 41 59)'; // slate-800
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength);
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] * 0.7;
                const hue = i * 2;
                canvasCtx.fillStyle = `hsl(${225 + hue}, 73%, 60%)`;
                canvasCtx.fillRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight);
                x += barWidth;
            }
        };
        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            source.disconnect();
            analyser.disconnect();
            audioContext.close().catch(console.error);
        };
    }, [stream, isSessionActive]);

    return (
         <div className="flex-grow flex flex-col overflow-hidden">
            <div className="relative mb-4 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center h-48 md:flex-grow">
                {isSessionActive && stream ? (
                    <canvas ref={visualizerCanvasRef} className="w-full h-full" />
                ) : (
                    <div className="text-center text-slate-400 p-4">
                        <SparklesIcon className="w-16 h-16 mx-auto mb-2 text-indigo-300" />
                        <h3 className="font-bold text-lg text-slate-300">Hello, {studentName}!</h3>
                        <p className="font-semibold mt-1">Ready to explore a new topic together?</p>
                        <p className="text-xs mt-4">Just press the microphone button to start talking.</p>
                    </div>
                )}
            </div>

             <div className="flex-grow bg-slate-50 border border-[var(--border-color)] rounded-xl p-4 overflow-y-auto mb-4">
                {transcriptionHistory.length === 0 && <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center"><p>Conversation transcript will appear here.</p></div>}
                <div className="space-y-4">
                    {transcriptionHistory.map((entry, index) => (
                        <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                            {entry.speaker === 'model' && <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold flex-shrink-0">A</div>}
                            <div className={`max-w-lg p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-slate-200' : 'bg-indigo-100'}`}><p>{entry.text}</p></div>
                            {entry.speaker === 'user' && <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold flex-shrink-0">{studentName.charAt(0)}</div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 text-center">
                <button onClick={() => isSessionActive ? handleStop() : handleStart()} className={`p-4 rounded-full transition-all duration-300 text-white shadow-lg transform hover:scale-110 ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'btn-primary'}`}>
                    {isSessionActive ? <StopIcon className="w-8 h-8" /> : <MicrophoneIcon className="w-8 h-8" />}
                </button>
                <p className="text-slate-500 mt-2 text-sm h-5">{status}</p>
            </div>
        </div>
    );
};


// --- Main Unified Component ---

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context: string | null;
  interventionContext: TutorInterventionContext | null;
  dktData: UserDktData;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, context, interventionContext, dktData }) => {
    const { activeProfile } = useAuth();
    const [mode, setMode] = useState<'live' | 'text'>('live');

    const studentName = activeProfile?.name || 'Student';
    const currentGrade = activeProfile?.grade || 'your grade';
    
    const baseSystemInstruction = `You are MIGA, an exceptionally friendly, patient, and engaging AI teacher for a K-12 CBSE student named ${studentName}. Your persona is that of a wise and fun mentor who makes learning exciting. Your primary goal is to help them truly understand concepts, not just give them answers.

        **Student's Context**:
        - Grade: ${currentGrade}
        - Curriculum: CBSE (India)

        **CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE PRECISELY**:
        1.  **100% Accuracy**: You must be completely accurate in your explanations, especially for mathematical and scientific concepts. Before responding to a problem-solving question, you must think step-by-step to deconstruct the problem, identify correct formulas, perform calculations carefully, and double-check your work to ensure you make NO mistakes.
        2.  **Friendly Teacher Persona**: Always be encouraging, positive, and patient. Address the student as ${studentName}. Use simple analogies and real-world examples to make complex topics clear.
        3.  **Vocal Emphasis (Audio Mode)**: You are in an audio-only conversation. To be more engaging, you MUST use vocal emphasis for key terms and important concepts. Vary your tone, pace, and volume naturally, just like a real teacher would to highlight what's important. For example, say a key term a little slower and louder for emphasis.
        4.  **Socratic Method**: Do not just give away answers. Guide ${studentName} by asking leading questions to help them arrive at the solution themselves.
        5.  **Language Detection**: You MUST detect the language ${studentName} is speaking (e.g., English, Hindi, Hinglish) and respond fluently in the exact same language.
        6.  **Stay on Topic**: Your role is strictly educational. If the query is unrelated to academic subjects (like Science, Maths, History, etc.), you must politely and gently decline, reminding them your purpose is to help with their studies.`;

    const finalSystemInstruction = useMemo(() => {
        if (interventionContext) {
            const { question, studentAnswer } = interventionContext;
            const correctAnswer = 'answer' in question ? question.answer : question.correct_answer;
            const rubric = 'rubric' in question ? question.rubric : question.explanation;

            return `You are MIGA, a patient and wise AI tutor. The student, ${studentName}, just answered a question incorrectly. Your task is to guide them to the correct answer using the Socratic method. Do NOT give them the answer directly. Ask step-by-step questions to help them identify their own mistake.

Here is the context:
- Question: "${question.question}"
- Their incorrect answer: "${studentAnswer}"
- Correct Answer/Rubric: "${correctAnswer} - ${rubric}"

Start the conversation by saying something warm and encouraging, like: "Hi ${studentName}, I saw that last question was a bit tricky. Let's walk through it together. Can you tell me how you first approached the problem?"`;
        }
        
        const weakSkills = Object.entries(dktData || {})
            .filter(([, data]) => (data as DktSkillState).mastery < 0.6)
            .sort(([, a], [, b]) => (a as DktSkillState).mastery - (b as DktSkillState).mastery)
            .slice(0, 3)
            .map(([skillId]) => skillId.split('-').slice(2).join(' '));
        
        let dktContext = '';
        if (weakSkills.length > 0) {
            dktContext = `\n\n**Student's Current Weaknesses**: The student is currently struggling with the following topics: ${weakSkills.join(', ')}. Please provide extra clear, step-by-step explanations and simple analogies for these topics. Be patient and encouraging.`;
        }

        if (context) {
            return `${baseSystemInstruction}${dktContext}\n\n**Current Student Context**: The student is currently viewing a lesson step. Use this context to inform your response:\n"${context}"`;
        }
        return `${baseSystemInstruction}${dktContext}`;
    }, [context, interventionContext, baseSystemInstruction, dktData, studentName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col h-[90vh] max-h-[800px] animate-scale-in" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-2 sm:p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-500" />
                        MIGA AI Tutor
                    </h2>
                    <div className="flex items-center gap-2">
                         <div className="p-1 bg-slate-200 rounded-lg flex gap-1">
                            <button onClick={() => setMode('live')} className={`px-2 py-1 text-sm font-semibold rounded-md flex items-center gap-1.5 ${mode === 'live' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><MicrophoneIcon className="w-4 h-4"/> Live</button>
                            <button onClick={() => setMode('text')} className={`px-2 py-1 text-sm font-semibold rounded-md flex items-center gap-1.5 ${mode === 'text' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><MessageSquareIcon className="w-4 h-4"/> Text</button>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                            <XIcon className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </header>
                <div className="flex-grow flex flex-col p-2 sm:p-4 overflow-hidden min-h-0">
                    {mode === 'live' ? (
                        <LiveTutorView systemInstruction={finalSystemInstruction} studentName={studentName} />
                    ) : (
                        <TextTutorView systemInstruction={finalSystemInstruction} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;