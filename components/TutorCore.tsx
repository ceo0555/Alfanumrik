import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage, GroundingChunk } from '../types';
import { SparklesIcon, QuoteIcon, RupeeIcon } from '../constants/icons';
import MarkdownRenderer from './MarkdownRenderer';

const SESSION_LIMIT = 5;

const TutorCore: React.FC = () => {
    const { activeProfile, handleSetTutorLock } = useAuth();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messageCount, setMessageCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (process.env.API_KEY && activeProfile) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chatInstance = ai.chats.create({
                model: 'gemini-2.5-pro', // Upgraded model for better reasoning
                config: {
                    systemInstruction: `You are MIGA, an expert academic AI specializing in the Indian K-12 CBSE curriculum. Your task is to act as a helpful and encouraging tutor for a student named ${activeProfile.name} in Class ${activeProfile.grade}. Your instructions are CRITICAL and must be followed with extreme precision to meet audit standards.
                    
                    **CRITICAL INSTRUCTIONS (NON-NEGOTIABLE)**:
                    1.  **CBSE & NCF Alignment**: All content MUST be strictly aligned with the latest CBSE syllabus, NCF guidelines, and official marking schemes for the student's grade.
                    2.  **Board Paper Integration**: Base your examples and question-solving approach on patterns from the **last 10 years of CBSE Board Papers**.
                    3.  **Socratic Method**: Do not just give away answers. Guide the student by asking leading questions. For definitions, provide them, but then ask a follow-up question to check for understanding.
                    4.  **Mathematical Accuracy & Vertical Formatting**: For numerical or problem-solving questions, you must be 100% accurate. Present your solution in a **vertical, step-by-step format**, as expected in CBSE model answer sheets.
                        - **Deconstruct the Problem**: Start by listing the given values.
                        - **State the Formula**: Clearly state the formula you will use.
                        - **Show Each Step**: Show each calculation step-by-step, vertically. Explain the logic for each step briefly.
                        - **Verify Your Work**: Before presenting the answer, double-check your calculations to ensure 100% accuracy.
                    5.  **Plain Text Formatting**: Format your answers clearly as step-by-step points. Use numbered lists, bullet points, and short paragraphs. The entire output must be plain text. Do not use markdown formatting like **bold** or *italics*.
                    6.  **Use Your Tools**: Rely on your search tool to find accurate, up-to-date information.
                    7.  **Educational Focus**: If the query is unrelated to academics, politely decline and explain your role.
                    `,
                    tools: [{ googleSearch: {} }],
                    thinkingConfig: { thinkingBudget: 32768 } // Max budget for deep reasoning
                },
            });
            setChat(chatInstance);
            setMessages([]); // Clear messages when profile changes
            setMessageCount(0); // Reset message count
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

        setMessageCount(prev => prev + 1);
        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const responseStream = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            const sources: GroundingChunk[] = [];
            const sourceMap = new Map<string, GroundingChunk>();

            setMessages(prev => [...prev, { role: 'model', content: '...', status: 'generating' }]);
            
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
                    lastMessage.content = modelResponse;
                    return newMessages;
                });
            }

             setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                lastMessage.status = 'done';
                lastMessage.sources = Array.from(sourceMap.values());
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
        return (
            <div className="prose prose-sm max-w-none prose-indigo">
                <MarkdownRenderer content={message.content} />
            </div>
        );
    };
    
    const isSessionLocked = messageCount >= SESSION_LIMIT && !activeProfile?.tutorSessionUnlocked;

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
                    {isSessionLocked ? (
                        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="font-semibold text-yellow-800">You've reached your free message limit for this session.</p>
                            <p className="text-sm text-yellow-700">Unlock unlimited messages with an AI Tutor Priority Pass from the Scholar's Wallet.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask any academic question..."
                                disabled={isLoading || !chat || isSessionLocked}
                                className="form-input w-full px-4 py-2 text-base"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim() || !chat || isSessionLocked}
                                className="btn btn-primary w-full sm:w-auto px-6 py-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                                ) : (
                                    "Ask"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TutorCore;