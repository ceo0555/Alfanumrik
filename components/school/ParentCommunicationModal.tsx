import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { generateParentCommunication } from '../../services/geminiService';
import { XIcon, MailIcon, ClipboardCopyIcon, CheckCircleIcon } from '../../constants/icons';

interface ParentCommunicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: UserProfile;
}

const ParentCommunicationModal: React.FC<ParentCommunicationModalProps> = ({ isOpen, onClose, student }) => {
    const { allDktData, allSubmissions } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const generateMessage = async () => {
                setIsLoading(true);
                setError('');
                setMessage('');
                try {
                    const studentDkt = allDktData[student.id] || {};
                    const studentSubmissions = allSubmissions.filter(s => s.studentId === student.id);
                    const generatedMessage = await generateParentCommunication(student, studentDkt, studentSubmissions);
                    setMessage(generatedMessage);
                } catch (e) {
                    console.error("Failed to generate parent communication:", e);
                    setError("Could not generate the AI message. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            };
            generateMessage();
        }
    }, [isOpen, student, allDktData, allSubmissions]);
    
    if (!isOpen) return null;

    const handleCopy = () => {
        const fullMessage = `Dear Parent of ${student.name},\n\n${message}\n\nBest regards,\n[Your Name]`;
        navigator.clipboard.writeText(fullMessage);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-lg flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <MailIcon className="w-6 h-6" /> AI-Drafted Update for {student.name}'s Parent
                    </h2>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
                </header>
                <div className="p-6">
                    {isLoading && (
                        <div className="text-center p-8">
                            <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div>
                            <p className="mt-3 text-slate-500">Generating message...</p>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {!isLoading && message && (
                        <textarea
                            readOnly
                            value={`Dear Parent of ${student.name},\n\n${message}\n\nBest regards,\n[Your Name]`}
                            className="form-textarea w-full bg-slate-50"
                            rows={8}
                        />
                    )}
                </div>
                <footer className="p-4 bg-slate-50 border-t flex justify-end gap-4">
                    <button onClick={onClose} className="btn bg-slate-200">Close</button>
                    <button onClick={handleCopy} disabled={!message} className="btn btn-primary flex items-center gap-2">
                        {isCopied ? <CheckCircleIcon className="w-5 h-5" /> : <ClipboardCopyIcon className="w-5 h-5" />}
                        {isCopied ? 'Copied!' : 'Copy Message'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ParentCommunicationModal;