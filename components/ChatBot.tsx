import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { ChatMessage } from '../types';
import { SparklesIcon } from '../constants/icons';

const ChatBot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (process.env.API_KEY) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chatInstance = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are MIGA, an expert academic AI specializing in the Indian K-12 CBSE curriculum. Your task is to act as a helpful and encouraging tutor for a student.
                    
                    **Instructions**:
                    1.  **Adhere to CBSE Standards**: Your answers must be strictly aligned with the CBSE curriculum and standards.
                    2.  **Socratic Method**: Do not just give away answers. Guide the student byasking leading questions. If a student asks for a definition, provide it, but then ask a follow-up question to check for understanding.
                    3.  **Encouraging Tone**: Be positive, patient, and encouraging.
                    4.  **Educational Focus**: Your purpose is to help with educational topics. If the query is unrelated to academics, school subjects, or learning, you must politely decline to answer and explain that your role is to assist with educational questions.
                    5.  **Clarity and Brevity**: Keep responses clear, concise, and easy to understand for a K-12 student. Use plain text only, no markdown formatting.
                    `,
                },
            });
            setChat(chatInstance);
        } else {
            setError("API_KEY not found. This feature is disabled.");
        }
    }, []);

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
            setMessages(prev => [...prev, { role: 'model', content: '...' }]);
            
            for await (const chunk of responseStream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        } catch (err) {
            console.error(err);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev => [...prev.slice(0, -1), { role: 'model', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 text-center">Chat with MIGA</h2>
            </div>
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
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">M</div>}
                            <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-slate-200 text-slate-800' : 'bg-indigo-50 text-slate-700'}`}>
                                <div className="whitespace-pre-wrap">
                                  <p>{msg.content}</p>
                                </div>
                            </div>
                            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-white font-bold flex-shrink-0">You</div>}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            {error && <div className="p-2 text-center text-sm text-red-600 bg-red-50">{error}</div>}
            <div className="p-4 border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question here..."
                        disabled={isLoading || !chat}
                        className="w-full px-4 py-2 text-base border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg transition disabled:bg-slate-100 bg-white"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !chat}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                        ) : (
                            "Send"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBot;