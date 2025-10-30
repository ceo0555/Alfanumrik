import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PracticeBlueprint, QuestionPoolItem, PracticeExam, PracticeResult } from '../types';
import { generatePracticeExam, generatePracticeReportSummary, gradeShortAnswer } from '../services/geminiService';
import { pastPapers } from '../constants/pastPapers';
import PracticeSetup from './PracticeSetup';
import PracticeTaker from './PracticeTaker';
import PracticeReport from './PracticeReport';
import Loader from './Loader';
import HonourCodeModal from './HonourCodeModal';
import OnDemandPracticeSetup from './OnDemandPracticeSetup';

type ExamState = 'setup' | 'loading' | 'active' | 'grading' | 'report';
type PracticeMode = 'blueprint' | 'past_paper' | 'unit_test';

interface PracticeCentreProps {
    examToStart?: { subject: string; blueprint: PracticeBlueprint } | null;
    onExamFinish: () => void;
    mode: 'on-demand' | null;
    onBack?: () => void;
}

const PracticeCentre: React.FC<PracticeCentreProps> = ({ examToStart, onExamFinish, mode, onBack }) => {
    const { activeProfile } = useAuth();
    const [examState, setExamState] = useState<ExamState>('setup');
    const [activeExam, setActiveExam] = useState<PracticeExam | null>(null);
    const [examResults, setExamResults] = useState<PracticeResult[]>([]);
    const [reportSummary, setReportSummary] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const [isHonourCodeOpen, setIsHonourCodeOpen] = useState(false);
    const [examPendingStart, setExamPendingStart] = useState<{ subject: string; blueprint: PracticeBlueprint; mode: PracticeMode; chapters?: string[]; year?: string; } | null>(null);
    const [examInfractions, setExamInfractions] = useState(0);
    
    useEffect(() => {
        if (examToStart) {
            handleShowHonourCode({ subject: examToStart.subject, blueprint: examToStart.blueprint, mode: 'blueprint' });
        }
    }, [examToStart]);

    const handleShowHonourCode = useCallback((startConfig: { subject: string, blueprint: PracticeBlueprint, mode: PracticeMode, chapters?: string[], year?: string }) => {
        if (!activeProfile) return;
        setExamPendingStart(startConfig);
        setIsHonourCodeOpen(true);
    }, [activeProfile]);

    const handleStartExam = useCallback(async () => {
        if (!examPendingStart || !activeProfile) return;
        
        setIsHonourCodeOpen(false);
        setExamState('loading');
        setError(null);

        try {
            let questions: QuestionPoolItem[];
            const { blueprint, subject, mode, chapters, year } = examPendingStart;

            if (mode === 'past_paper' && year) {
                const paperData = pastPapers[year]?.[subject];
                if (!paperData) {
                    throw new Error(`Past paper for ${subject} ${year} not found.`);
                }
                questions = paperData;
            } else {
                questions = await generatePracticeExam(activeProfile.grade, subject, blueprint, chapters);
            }

            setActiveExam({
                blueprint: blueprint,
                questions,
                answers: {},
                markedForReview: new Set(),
                startTime: Date.now(),
            });
            setExamState('active');
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate the practice exam. The AI model may be unavailable. Please try again.';
            setError(errorMessage);
            setExamState('setup');
        } finally {
            setExamPendingStart(null);
        }
    }, [activeProfile, examPendingStart]);


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
                if (isCorrect) {
                    marksAwarded = question.marks;
                }
            } else if (question.type === 'SA' || question.type === 'LA' || question.type === 'Case') { // Handle all written types
                try {
                    const gradingResult = await gradeShortAnswer(question.question, question.rubric, question.marks, studentAnswer as string);
                    marksAwarded = gradingResult?.awardedMarks ?? 0;
                    aiFeedback = gradingResult?.feedback ?? "AI grading failed for this question.";
                    // A question is considered fully "correct" only if they get full marks.
                    isCorrect = marksAwarded === question.marks;
                } catch(e) {
                    console.error("Error during AI grading for SA question:", e);
                    marksAwarded = 0;
                    aiFeedback = "An error occurred during AI grading.";
                    isCorrect = false;
                }
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

    const resetState = () => {
        setExamState('setup');
        setActiveExam(null);
        setExamResults([]);
        setReportSummary('');
        setExamInfractions(0);
        onExamFinish();
    };

    const handleTryAgain = () => {
        resetState();
    };

    const handleBackToSetup = useCallback(() => {
        if (window.confirm('Are you sure you want to exit the exam? Your progress will be lost.')) {
            resetState();
        }
    }, [onExamFinish]);

    const renderContent = () => {
        switch (examState) {
            case 'setup':
                if (mode === 'on-demand') {
                    return <OnDemandPracticeSetup onStartExam={(subject, blueprint, chapters) => handleShowHonourCode({ subject, blueprint, mode: 'unit_test', chapters })} onBack={onBack} />;
                }
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
                onClose={() => {
                    setIsHonourCodeOpen(false);
                    onExamFinish(); // Clear state if user cancels
                }}
                onAgree={handleStartExam}
            />
        </div>
    );
};

export default PracticeCentre;