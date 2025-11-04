import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PaperBlueprint, ExamSession, ExamSubmission, AIProctoringReport, QuestionPoolItem } from '../../types';
import { ShieldCheckIcon, PlusIcon, SparklesIcon, XIcon, ArrowLeftIcon } from '../../constants/icons';
import { generateExamAnalyticsReport } from '../../services/geminiService';

const generateSessionCode = () => {
    return 'EXAM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const ExamsTab: React.FC = () => {
    const {
        allBlueprints,
        allExamSessions,
        allExamSubmissions,
        handleSaveExamSessions,
        userProfiles,
        itemBank
    } = useAuth();
    
    const [view, setView] = useState<'list' | 'proctoring'>('list');
    const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
    const [aiReport, setAiReport] = useState<AIProctoringReport | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const handleStartSession = (blueprint: PaperBlueprint) => {
        const newSession: ExamSession = {
            id: `sess-${Date.now()}`,
            blueprintId: blueprint.id,
            code: generateSessionCode(),
            startTime: Date.now(),
            isActive: true,
        };
        handleSaveExamSessions([...allExamSessions, newSession]);
        setActiveSession(newSession);
        setView('proctoring');
    };

    const handleEndSession = () => {
        if (!activeSession) return;
        const updatedSessions = allExamSessions.map(s => s.id === activeSession.id ? { ...s, isActive: false, endTime: Date.now() } : s);
        handleSaveExamSessions(updatedSessions);
        setActiveSession(prev => prev ? { ...prev, isActive: false } : null);
    };
    
    const handleGenerateReport = async () => {
        if (!activeSession) return;
        setIsGeneratingReport(true);
        setAiReport(null);
        
        try {
            const submissions = allExamSubmissions.filter(s => s.sessionId === activeSession.id);
            const blueprint = allBlueprints.find(b => b.id === activeSession.blueprintId);
            if (!blueprint) {
                throw new Error("Blueprint not found for session.");
            }
            // Simplified question retrieval. A real app might store question IDs in the session.
            const questions = itemBank.filter(q => q.source === blueprint.name); 

            const report = await generateExamAnalyticsReport(blueprint, questions, submissions, userProfiles);
            setAiReport(report);
        } catch (e) {
            console.error(e);
            alert("Failed to generate AI report.");
        } finally {
            setIsGeneratingReport(false);
        }
    };
    
    if (view === 'proctoring' && activeSession) {
        const submissions = allExamSubmissions.filter(s => s.sessionId === activeSession.id);
        const blueprint = allBlueprints.find(b => b.id === activeSession.blueprintId);
        return (
            <div className="p-4 bg-white rounded-lg border">
                <button onClick={() => setView('list')} className="btn text-sm bg-slate-100 mb-4"><ArrowLeftIcon className="w-4 h-4 mr-1"/> Back to List</button>
                <div className="text-center p-6 bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200">
                    <h3 className="font-bold text-lg">Session Code for "{blueprint?.name}":</h3>
                    <p className="font-mono text-4xl font-extrabold tracking-widest my-2 text-indigo-700">{activeSession.code}</p>
                    <p className={`font-bold text-sm ${activeSession.isActive ? 'text-green-600 animate-pulse' : 'text-red-600'}`}>
                        {activeSession.isActive ? 'SESSION IS LIVE' : 'SESSION ENDED'}
                    </p>
                </div>
                
                <div className="mt-6">
                    <h4 className="font-bold mb-2">Live Proctoring ({submissions.length} joined)</h4>
                    <div className="space-y-2">
                        {submissions.map(sub => {
                            const student = userProfiles.find(p => p.id === sub.studentId);
                            return (
                                <div key={sub.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                    <span className="font-semibold">{student?.name}</span>
                                    <div>
                                        <span className={`font-bold text-sm ${sub.infractions > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {sub.infractions} Infractions
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6 flex gap-4">
                    {activeSession.isActive && <button onClick={handleEndSession} className="btn bg-red-500 text-white hover:bg-red-600">End Session</button>}
                    {!activeSession.isActive && (
                        <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="btn btn-primary flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5"/> {isGeneratingReport ? 'Analyzing...' : 'Generate AI Proctoring Report'}
                        </button>
                    )}
                </div>
                {aiReport && (
                     <div className="mt-6 p-4 bg-slate-50 rounded-lg border animate-fade-in">
                        <h4 className="font-bold text-lg mb-2">AI Proctoring Report</h4>
                        <p className="text-sm text-slate-700 mb-4">{aiReport.summary}</p>
                        {aiReport.suspiciousClusters.length > 0 && <div><h5 className="font-semibold">Potential Collaboration Clusters:</h5><ul className="list-disc list-inside text-sm">{aiReport.suspiciousClusters.map((c, i) => <li key={i}>{c.reason} (Students: {c.studentIds.map(id => userProfiles.find(p=>p.id === id)?.name).join(', ')})</li>)}</ul></div>}
                        {aiReport.highInfractionStudents.length > 0 && <div className="mt-2"><h5 className="font-semibold">High Infraction Counts:</h5><ul className="list-disc list-inside text-sm">{aiReport.highInfractionStudents.map((s, i) => <li key={i}>{userProfiles.find(p=>p.id === s.studentId)?.name}: {s.count} infractions</li>)}</ul></div>}
                     </div>
                )}
            </div>
        );
    }
    
    return (
        <div>
            <h3 className="font-bold text-lg mb-4">Exam Blueprints</h3>
            <div className="space-y-3">
                {allBlueprints.map(bp => (
                    <div key={bp.id} className="p-4 bg-white rounded-lg border flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{bp.name}</p>
                            <p className="text-xs text-slate-500">{bp.subject} - Class {bp.grade} | {bp.totalMarks} Marks</p>
                        </div>
                        <button onClick={() => handleStartSession(bp)} className="btn btn-primary flex items-center gap-2 text-sm">
                            <ShieldCheckIcon className="w-4 h-4"/> Start Secure Session
                        </button>
                    </div>
                ))}
                 {allBlueprints.length === 0 && <p className="text-slate-500">No exam blueprints created yet. Go to the 'Exam Suite' to create one.</p>}
            </div>
        </div>
    );
};

export default ExamsTab;