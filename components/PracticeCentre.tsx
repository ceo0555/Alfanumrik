import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PracticeBlueprint, QuestionPoolItem, PracticeExam, PracticeResult } from '../types';
import { generatePracticeExam, generatePracticeReportSummary, gradeShortAnswer } from '../services/geminiService';
import PracticeSetup from './PracticeSetup';
import PracticeTaker from './PracticeTaker';
import PracticeReport from './PracticeReport';
import Loader from './Loader';
import HonourCodeModal from './HonourCodeModal';

type ExamState = 'setup' | 'loading' | 'active' | 'grading' | 'report';

const PracticeCentre: React.FC = () => {
    const { activeProfile } = useAuth();
    const [examState, setExamState] = useState<ExamState>('setup');
    const [activeExam, setActiveExam] = useState<PracticeExam | null>(null);
    const [examResults, setExamResults] = useState<PracticeResult[]>([]);
    const [reportSummary, setReportSummary] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // New states for focus mode flow
    const [isHonourCodeOpen, setIsHonourCodeOpen] = useState(false);
    const [examToStart, setExamToStart] = useState<{ subject: string, blueprint: PracticeBlueprint } | null>(null);
    const [examInfractions, setExamInfractions] = useState(0);

    const handleShowHonourCode = useCallback((subject: string, blueprint: PracticeBlueprint) => {
        if (!activeProfile) return;
        setExamToStart({ subject, blueprint });
        setIsHonourCodeOpen(true);
    }, [activeProfile]);

    const handleStartExam = useCallback(async () => {
        if (!examToStart || !activeProfile) return;
        
        setIsHonourCodeOpen(false);
        setExamState('loading');
        setError(null);

        try {
            const questions = await generatePracticeExam(activeProfile.grade, examToStart.subject, examToStart.blueprint);
            setActiveExam({
                blueprint: examToStart.blueprint,
                questions,
                answers: {},
                markedForReview: new Set(),
                startTime: Date.now(),
            });
            setExamState('active');
        } catch (err) {
            console.error(err);
            setError('Failed to generate the practice exam. The AI model may be unavailable. Please try again.');
            setExamState('setup');
        } finally {
            setExamToStart(null);
        }
    }, [activeProfile, examToStart]);


    const handleFinishExam = useCallback(async (finalAnswers: { [q_id: string]: string }, infractions: number) => {
        if (!activeExam) return;
        setExamState('grading');
        setExamInfractions(infractions);
        
        const results: PracticeResult[] = [];
        for (const question of activeExam.questions) {
            const studentAnswer = finalAnswers[question.q_id] || '';
            let isCorrect = false;
            let aiFeedback: string | null = null;
            let marksAwarded = 0;

            if (question.type === 'MCQ') {
                isCorrect = studentAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
            } else if (question.type === 'SA') {
                const gradingResult = await gradeShortAnswer(question.question, question.rubric, studentAnswer);
                isCorrect = gradingResult?.isCorrect ?? false;
                aiFeedback = gradingResult?.feedback ?? "AI grading failed for this question.";
            }
            
            if (isCorrect) {
                marksAwarded = question.marks;
            }
            
            results.push({ q_id: question.q_id, question, studentAnswer, isCorrect, marksAwarded, aiFeedback });
        }
        
        setExamResults(results);
        
        // Generate AI summary
        const summary = await generatePracticeReportSummary(results);
        setReportSummary(summary);
        
        setActiveExam(prev => prev ? { ...prev, endTime: Date.now() } : null);
        setExamState('report');

    }, [activeExam]);

    const handleTryAgain = () => {
        setExamState('setup');
        setActiveExam(null);
        setExamResults([]);
        setReportSummary('');
        setExamInfractions(0);
    };

    const handleBackToSetup = useCallback(() => {
        if (window.confirm('Are you sure you want to exit the exam? Your progress will be lost.')) {
            setExamState('setup');
            setActiveExam(null);
            setExamResults([]);
            setReportSummary('');
            setExamInfractions(0);
        }
    }, []);

    const renderContent = () => {
        switch (examState) {
            case 'setup':
                return <PracticeSetup onStartExam={handleShowHonourCode} error={error} />;
            case 'loading':
            case 'grading':
                 return <div className="flex flex-col items-center justify-center h-full">
                    <Loader />
                    <p className="text-slate-600 font-semibold mt-4">{examState === 'loading' ? 'Generating your exam...' : 'Grading your answers...'}</p>
                </div>;
            case 'active':
                if (!activeExam) return <p>Error: Exam data not found.</p>;
                return <PracticeTaker exam={activeExam} onFinishExam={handleFinishExam} onBack={handleBackToSetup} />;
            case 'report':
                 if (!activeExam) return <p>Error: Exam data not found.</p>;
                return <PracticeReport exam={activeExam} results={examResults} summary={reportSummary} onTryAgain={handleTryAgain} infractions={examInfractions} />;
            default:
                return null;
        }
    };

    return (
        <div>
            {renderContent()}
            <HonourCodeModal 
                isOpen={isHonourCodeOpen}
                onClose={() => setIsHonourCodeOpen(false)}
                onAgree={handleStartExam}
            />
        </div>
    );
};

export default PracticeCentre;