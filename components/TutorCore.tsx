import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage, GroundingChunk } from '../types';
import { SparklesIcon, QuoteIcon } from '../constants/icons';

const TutorCore: React.FC = () => {
    const { activeProfile } = useAuth();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (process.env.API_KEY && activeProfile) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chatInstance = ai.chats.create({
                model: 'gemini-2.5-pro', // Upgraded model for better reasoning
                config: {
                    systemInstruction: `You are MIGA, an expert academic AI specializing in the Indian K-12 CBSE curriculum. Your task is to act as a helpful and encouraging tutor for a student named ${activeProfile.name} in Class ${activeProfile.grade}.
                    
                    **Instructions**:
                    1.  **Multilingual Support**: You MUST detect the language the student is typing in (e.g., English, Hindi, Hinglish). You MUST respond in the exact same language. Do not translate unless explicitly asked.
                    2.  **Use Your Tools**: Rely on your search tool to find accurate, up-to-date information to answer student questions on ANY academic subject.
                    3.  **Adhere to CBSE Standards**: Your answers must be strictly aligned with the CBSE curriculum and standards for the student's grade.
                    4.  **Socratic Method**: Do not just give away answers. Guide the student by asking leading questions. For definitions, provide them, but then ask a follow-up question to check for understanding.
                    5.  **Mathematical Accuracy**: For numerical or problem-solving questions, you must be 100% accurate. Before responding, think step-by-step to deconstruct the problem, identify the correct formulas, perform the calculations carefully, and double-check your work. Guide the student through these verified steps. Do not provide the final answer directly, but ensure every step and calculation you provide is mathematically sound.
                    6.  **Structure and Formatting**: Format your answers clearly. Use numbered lists, bullet points, and short paragraphs to break down complex topics or steps, similar to how answers are presented in CBSE model answer sheets. Make it easy to read and learn from.
                    7.  **Encouraging Tone**: Be positive, patient, and encouraging.
                    8.  **Educational Focus**: If the query is unrelated to academics, politely decline and explain your role.
                    `,
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: { thinkingBudget: 32768 } // Max budget for deep reasoning
                },
            });
            setChat(chatInstance);
            setMessages([]); // Clear messages when profile changes
        } else if (!process.env.API_KEY) {
            setError("API_KEY not found. This feature is disabled.");
        }
    }, [activeProfile]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const responseStream = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            
            setMessages(prev => [...prev, { role: 'model', content: '...', status: 'generating' }]);
            
            for await (const chunk of responseStream) {
                modelResponse += chunk.text;
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    lastMessage.content = modelResponse;
                    return newMessages;
                });
            }

             setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].status = 'done';
                return newMessages;
            });

        } catch (err) {
            console.error(err);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev => {
                const updatedMessages = [...prev];
                updatedMessages[updatedMessages.length - 1] = { role: 'model', content: errorMessage, status: 'done' };
                return updatedMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (message: ChatMessage) => {
        if (message.status === 'generating' && message.content === '...') {
            return <p className="text-sm italic text-slate-500">MIGA is thinking...</p>;
        }
        return <p className="whitespace-pre-wrap">{message.content}</p>;
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full animate-slide-in-up">
            <div className="flex-grow flex flex-col bg-white rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                <div className="flex-grow p-4 overflow-y-auto">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                            <SparklesIcon className="w-16 h-16 mb-4"/>
                            <h3 className="font-bold text-slate-600 text-lg">AI Tutor is Ready</h3>
                            <p className="max-w-xs mt-1">Ask me anything about your subjects to get a grounded, authentic answer.</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold flex-shrink-0">A</div>}
                                <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-slate-100 text-slate-800' : 'bg-indigo-50 text-slate-700'}`}>
                                    {renderMessageContent(msg)}
                                </div>
                                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold flex-shrink-0">{activeProfile?.name.charAt(0)}</div>}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                {error && <div className="p-2 text-center text-sm text-red-600 bg-red-50 border-t">{error}</div>}
                <div className="p-4 border-t border-[var(--border-color)] bg-white">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask any academic question..."
                            disabled={isLoading || !chat}
                            className="form-input w-full px-4 py-2 text-base"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim() || !chat}
                            className="btn btn-primary w-full sm:w-auto px-6 py-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                            ) : (
                                "Ask"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TutorCore;