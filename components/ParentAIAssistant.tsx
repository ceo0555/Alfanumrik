import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateParentalInsight } from '../services/geminiService';
import { ChatMessage, UserProfile, UserDktData, Assignment, StudentSubmission } from '../types';
import { MessageSquareIcon } from '../constants/icons';

interface ParentAIAssistantProps {
    studentData: {
        profile: UserProfile;
        dktData: UserDktData;
        assignments: Assignment[];
        submissions: StudentSubmission[];
    };
}

const ParentAIAssistant: React.FC<ParentAIAssistantProps> = ({ studentData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent | string) => {
        if (typeof e !== 'string') e.preventDefault();
        const query = typeof e === 'string' ? e : input;
        if (!query.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const modelResponse = await generateParentalInsight(query, studentData);
            setMessages(prev => [...prev, { role: 'model', content: modelResponse }]);
        } catch (err) {
            console.error(err);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestedPrompts = [
        `How is ${studentData.profile.name} doing in Maths?`,
        "What are their weakest topics?",
        "What assignments are due this week?",
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <MessageSquareIcon className="w-6 h-6 text-indigo-500" />
                Ask MIGA about {studentData.profile.name}'s Progress
            </h3>

            <div className="h-64 bg-slate-50 rounded-lg border p-4 overflow-y-auto mb-4">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 text-sm ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">AI</div>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-slate-200 text-slate-800' : 'bg-indigo-100 text-slate-700'}`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            {msg.role === 'user' && <div className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">You</div>}
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center text-slate-400 pt-8">
                            <p>e.g., "What was the score on the last science quiz?"</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
                {suggestedPrompts.map(prompt => (
                    <button key={prompt} onClick={() => handleSendMessage(prompt)} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full hover:bg-indigo-100">
                        {prompt}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    disabled={isLoading}
                    className="form-input w-full"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="btn btn-primary"
                >
                    {isLoading ? "Thinking..." : "Ask"}
                </button>
            </form>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
    );
};

export default ParentAIAssistant;