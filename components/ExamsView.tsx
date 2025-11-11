import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ExamSession, PaperBlueprint, PracticeBlueprint, QuestionPoolItem, ScratchpadState } from '../types';
import HonourCodeModal from './HonourCodeModal';
import PracticeTaker from './PracticeTaker';
import Loader from './Loader';
import { ShieldCheckIcon } from '../constants/icons';

const ExamsView: React.FC = () => {
    const { allExamSessions, allBlueprints, itemBank, handleSaveExamSubmission, activeProfile } = useAuth();
    const [sessionCode, setSessionCode] = useState('');
    const [error, setError] = useState('');
    const [sessionToJoin, setSessionToJoin] = useState<ExamSession | null>(null);
    const [activeExam, setActiveExam] = useState<{ blueprint: PaperBlueprint, questions: QuestionPoolItem[] } | null>(null);
    const [isHonourCodeOpen, setIsHonourCodeOpen] = useState(false);
    
    if (!activeProfile) return <p>No active profile.</p>;

    const findSession = (code: string) => {
        return allExamSessions.find(s => s.code === code && s.isActive);
    };

    const handleJoinSession = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const session = findSession(sessionCode.trim().toUpperCase());
        if (session) {
            setSessionToJoin(session);
            setIsHonourCodeOpen(true);
        } else {
            setError("Invalid or inactive session code. Please check with your teacher.");
        }
    };
    
    const handleAgreeAndStart = () => {
        if (!sessionToJoin) return;
        
        const blueprint = allBlueprints.find(b => b.id === sessionToJoin.blueprintId);
        
        if (blueprint) {
            // This is a simplified assembly for the student view.
            // A more robust system would fetch the exact paper from the server based on the session.
            const questionsForPaper = itemBank.filter(item => {
                return blueprint.sections.some(section =>
                    item.type === section.questionType &&
                    item.marks === section.marksPerQuestion &&
                    (item.source?.includes(blueprint.name) || item.q_id.startsWith(`G${blueprint.grade}`)) // Mock matching logic
                );
            });
            
            setActiveExam({ blueprint, questions: questionsForPaper });
            setIsHonourCodeOpen(false);
        } else {
            setError("Could not load the exam paper for this session.");
            setIsHonourCodeOpen(false);
        }
    };
    
    const handleFinishExam = (answers: { [q_id: string]: string | ScratchpadState }, infractions: number) => {
        if (!sessionToJoin || !activeProfile) return;
        
        handleSaveExamSubmission({
            sessionId: sessionToJoin.id,
            studentId: activeProfile.id,
            answers,
            submittedAt: Date.now(),
            infractions,
        });
        
        alert("Your exam has been submitted successfully!");
        setActiveExam(null);
        setSessionToJoin(null);
        setSessionCode('');
    };

    if (activeExam) {
        // FIX: Transformed PaperBlueprint into PracticeBlueprint to match PracticeTaker's expected props.
        const practiceBlueprint: PracticeBlueprint = {
            id: activeExam.blueprint.id,
            title: activeExam.blueprint.name,
            description: `Secure exam for ${activeExam.blueprint.subject}, Class ${activeExam.blueprint.grade}.`,
            durationMinutes: 180, // Default to 3 hours for a board exam
            totalMarks: activeExam.blueprint.totalMarks,
            structure: activeExam.blueprint.sections.map(s => ({
                section: s.name,
                questionType: s.questionType,
                count: s.questions,
                marksPerQuestion: s.marksPerQuestion
            }))
        };
        return (
            <PracticeTaker
                exam={{
                    blueprint: practiceBlueprint,
                    questions: activeExam.questions,
                    answers: {},
                    markedForReview: new Set(),
                    startTime: Date.now(),
                }}
                onFinishExam={handleFinishExam}
                onBack={() => {
                    if (window.confirm("Are you sure you want to exit? Your progress will be lost.")) {
                        setActiveExam(null);
                    }
                }}
            />
        );
    }

    return (
        <div className="max-w-md mx-auto text-center animate-slide-in-up">
            <div className="p-8 bg-white rounded-xl shadow-lg border">
                <ShieldCheckIcon className="w-16 h-16 mx-auto text-indigo-500 bg-indigo-50 p-3 rounded-full" />
                <h1 className="text-2xl font-bold text-slate-800 mt-4">Join Secure Exam</h1>
                <p className="text-slate-500 mt-2">Enter the session code provided by your teacher to begin the exam.</p>

                <form onSubmit={handleJoinSession} className="mt-6">
                    <input
                        type="text"
                        value={sessionCode}
                        onChange={(e) => setSessionCode(e.target.value)}
                        placeholder="SESSION-CODE"
                        className="form-input w-full text-center tracking-[0.2em] font-mono text-lg uppercase"
                    />
                    <button type="submit" className="btn btn-primary w-full mt-4">
                        Join Session
                    </button>
                </form>
                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </div>

            <HonourCodeModal 
                isOpen={isHonourCodeOpen}
                onClose={() => setIsHonourCodeOpen(false)}
                onAgree={handleAgreeAndStart}
            />
        </div>
    );
};

export default ExamsView;
