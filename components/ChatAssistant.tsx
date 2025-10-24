import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage } from '../types';
import { SparklesIcon, MessageSquareIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';

const ChatAssistant: React.FC = () => {
    const { activeProfile } = useAuth();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!process.env.API_KEY || !activeProfile) {
            setError("Assistant is unavailable.");
            return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const { name, grade, lastSubject, lastChapter } = activeProfile;

        const systemInstruction = `You are MIGA, an expert academic AI specializing in the Indian K-12 CBSE curriculum. You are a helpful and encouraging tutor for a student named ${name}.

        **Current Student Context**:
        - Grade: ${grade}
        - Subject: ${lastSubject}
        - Chapter: "${lastChapter}"
        
        **Instructions**:
        1.  **Prioritize Context**: Always assume the student's questions relate to their current chapter ("${lastChapter}") unless they specify otherwise. Use this context to give highly relevant answers.
        2.  **Socratic Method**: Don't just give away answers. Guide the student by asking leading questions. If a student asks for a definition, provide it, but then ask a follow-up question to check for understanding.
        3.  **Encouraging Tone**: Be positive, patient, and encouraging. Address the student by their name, ${name}.
        4.  **Educational Focus**: Your purpose is to help with educational topics. If the query is unrelated to academics, politely decline and explain your role.
        5.  **Clarity**: Keep responses clear, concise, and easy to understand for a Grade ${grade} student. Use simple markdown like bolding for key terms.
        `;

        const chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
        });

        setChat(chatInstance);
        setMessages([]);
        setError(null);

    }, [activeProfile]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const responseStream = await chat.sendMessageStream({ message: currentInput });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);
            
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
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', content: errorMessage };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderMarkdown = (text: string) => {
        const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-full animate-slide-in-up">
            <div className="flex-grow flex flex-col bg-white rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                <div className="flex-grow p-4 overflow-y-auto">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                            <SparklesIcon className="w-16 h-16 mb-4"/>
                            <p className="max-w-xs">I'm ready to help you with <strong>{activeProfile?.lastChapter}</strong>. Ask me anything!</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold flex-shrink-0">M</div>}
                                <div className={`max-w-lg p-3 rounded-lg prose prose-sm prose-slate max-w-none ${msg.role === 'user' ? 'bg-slate-100 text-slate-800' : 'bg-indigo-50 text-slate-700'}`}>
                                    {renderMarkdown(msg.content)}
                                </div>
                                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold flex-shrink-0">{activeProfile?.name.charAt(0)}</div>}
                            </div>
                        ))}
                         {isLoading && messages[messages.length - 1]?.role === 'user' && (
                             <div className="flex items-start gap-3">
                                 <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold flex-shrink-0">M</div>
                                 <div className="max-w-lg p-3 rounded-lg bg-indigo-50 text-slate-700">
                                     <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                     </div>
                                 </div>
                             </div>
                         )}
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
                            placeholder="Ask a question about your lesson..."
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
                                "Send"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatAssistant;