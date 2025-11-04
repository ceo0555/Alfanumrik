import React, { useState, useEffect } from 'react';
import { UserProfile, PtmBrief } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { generatePtmBrief } from '../../services/geminiService';
import { XIcon, UsersIcon, CheckCircleIcon, TargetIcon } from '../../constants/icons';

interface PtmBrieferModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: UserProfile;
}

const PtmBrieferModal: React.FC<PtmBrieferModalProps> = ({ isOpen, onClose, student }) => {
    const { allDktData, allAssignments, allSubmissions } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [brief, setBrief] = useState<PtmBrief | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchBrief = async () => {
                setIsLoading(true);
                setError('');
                setBrief(null);
                try {
                    const studentDkt = allDktData[student.id] || {};
                    const studentAssignments = allAssignments.filter(a => a.classGrade === student.grade);
                    const studentSubmissions = allSubmissions.filter(s => s.studentId === student.id);
                    
                    const generatedBrief = await generatePtmBrief(student, studentDkt, studentAssignments, studentSubmissions);
                    setBrief(generatedBrief);
                } catch (e) {
                    console.error("Failed to generate PTM brief:", e);
                    setError("Could not generate the AI brief. The model may be unavailable or there was an issue with the data.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchBrief();
        }
    }, [isOpen, student, allDktData, allAssignments, allSubmissions]);

    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center p-8">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-slate-500 font-semibold">MIGA is synthesizing {student.name}'s data...</p>
                </div>
            );
        }
        if (error) {
            return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">{error}</div>;
        }
        if (brief) {
            return (
                <div className="space-y-4 text-sm">
                    <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
                        <h4 className="font-bold text-indigo-800">Overall Summary</h4>
                        <p className="text-slate-700 mt-1">{brief.summary}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <h5 className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/> Strengths</h5>
                            <ul className="list-disc list-inside mt-1 text-slate-600 space-y-1">
                                {brief.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                         <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h5 className="font-bold text-yellow-800 flex items-center gap-2"><TargetIcon className="w-5 h-5"/> Areas for Focus</h5>
                            <ul className="list-disc list-inside mt-1 text-slate-600 space-y-1">
                                {brief.focusAreas.map((f, i) => <li key={i}>{f}</li>)}
                            </ul>
                        </div>
                    </div>
                     <div>
                        <h5 className="font-bold text-slate-700">Behavioral Observations</h5>
                        <ul className="list-disc list-inside mt-1 text-slate-600 space-y-1">
                            {brief.behavioralObservations.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-bold text-slate-700">Suggested Talking Points</h5>
                        <ul className="list-disc list-inside mt-1 text-slate-600 space-y-1">
                            {brief.suggestedTalkingPoints.map((tp, i) => <li key={i}>{tp}</li>)}
                        </ul>
                    </div>
                    <p className="italic text-slate-500 pt-2 border-t">{brief.closingRemark}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b flex-shrink-0">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <UsersIcon className="w-6 h-6" /> PTM Briefing for {student.name}
                    </h2>
                    <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
                </header>
                <div className="p-6 overflow-y-auto flex-grow">
                    {renderContent()}
                </div>
                <footer className="p-4 bg-slate-50 border-t flex justify-end flex-shrink-0">
                    <button onClick={onClose} className="btn bg-slate-200">Close</button>
                </footer>
            </div>
        </div>
    );
};

export default PtmBrieferModal;