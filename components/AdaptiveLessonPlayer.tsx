import React, { useState, useRef, useEffect, Suspense } from 'react';
import { LessonPack, AssessmentResult, AdaptiveFollowUp, LessonStep, LessonStepType, QuestionPoolItem, InteractiveSimulation, LtiContext, CoreExplanationStep, QuickCheckStep, StructuredContent } from '../types';
import { generateAdaptiveFollowUp, generateStudyNotes, generatePracticeQuiz, explainTextSnippet, generateMicroRemediation } from '../services/geminiService';
import { transformLessonPackToSteps } from '../utils/lessonHelpers';
import { SparklesIcon, ArrowLeftIcon, ArrowRightIcon, BookIcon, FileTextIcon, ClipboardCopyIcon, ClipboardListIcon, CheckCircleIcon, ChevronDownIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';
import { useAuth } from '../contexts/AuthContext';
import * as ltiService from '../services/ltiService';

// Import all the step components
import TopicTitleStep from './TopicTitleStep';
import CoreExplanationStepComponent from './CoreExplanationStep';
import QuickCheckStepComponent from './QuickCheck';
import ImageBriefStep from './ImageBriefStep';
import WorkedExampleStep from './WorkedExampleStep';
import PracticeStep from './PracticeStep';
import HOTSStep from './HOTSStep';
import CommonErrorStep from './CommonErrorStep';
import FillInTheBlanksStep from './FillInTheBlanks';
import InteractiveSimulationStep from './InteractiveSimulationStep';
import AssessmentIntroStep from './AssessmentIntroStep';
import AssessmentQuestionStep from './AssessmentQuestionStep';
import AdaptiveIntroStep from './AdaptiveIntroStep';
import AdaptiveFollowUpStep from './AdaptiveFollowUpStep';
import FeedbackStep from './FeedbackStep';
import KeyTermStep from './KeyTermStep';
import NoteStep from './NoteStep';
import TTSPlayer from './TTSPlayer';

const SimulationExplainerModal = React.lazy(() => import('./SimulationExplainerModal'));
const InteractiveVideoStep = React.lazy(() => import('./InteractiveVideoStep'));


interface AdaptiveLessonPlayerProps {
  lessonPack: LessonPack | null;
  ltiContext?: LtiContext | null;
  isTransitioning?: boolean;
}

const getTextForTTS = (step: LessonStep | undefined): string => {
    if (!step) return '';
    
    let textParts: string[] = [];
    
    const extractFromStructuredContent = (content: StructuredContent[]) => {
        content.forEach(block => {
            switch(block.type) {
                case 'heading':
                    textParts.push(block.content);
                    break;
                case 'paragraph':
                    textParts.push(block.content);
                    break;
                case 'list':
                    textParts.push(block.items.join('. '));
                    break;
                case 'key_term':
                    textParts.push(`${block.term}. ${block.definition}`);
                    break;
                case 'note':
                    textParts.push(`Note: ${block.content}`);
                    break;
            }
        });
    };

    switch(step.type) {
        case 'topic_title':
            textParts.push(`Starting lesson: ${step.content.topic_name}`);
            break;
        case 'core_explanation':
            extractFromStructuredContent(step.content);
            break;
        case 'quick_check':
        case 'assessment_question':
            textParts.push((step.content as any).question);
            break;
        case 'worked_example':
             textParts.push(`Worked example. Prompt: ${step.content.prompt}. Solution: ${step.content.solution}. Here is why it works: ${step.content.why_it_works}`);
            break;
        case 'guided_practice':
             textParts.push(`Guided practice. Question: ${step.content.question}`);
            break;
        case 'independent_practice':
            textParts.push(`Practice Problem. Question: ${step.content.question}`);
            break;
        case 'HOTS':
            textParts.push(`Higher-Order Thinking Question: ${step.content.question}`);
            break;
        case 'common_error':
            textParts.push(`A common mistake to avoid. The mistake is: ${step.content.error}. The correction is: ${step.content.fix}`);
            break;
        case 'fill_in_the_blanks':
            textParts.push(`Fill in the blank. ${step.content.sentence_parts.join(' blank ')}`);
            break;
    }
    return textParts.join('\n\n');
};


const AdaptiveLessonPlayer: React.FC<AdaptiveLessonPlayerProps> = ({ lessonPack, ltiContext, isTransitioning }) => {
  const { activeProfile } = useAuth();
  const { progressData, markChapterAsCompleted, awardXP, recordAnswer, updateChapterStep } = useStudentData();
  
  const [originalSteps, setOriginalSteps] = useState<LessonStep[]>([]);
  const [steps, setSteps] = useState<LessonStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepCompleted, setIsStepCompleted] = useState(true);
  const [stepAnswers, setStepAnswers] = useState<{ [index: number]: { answer: string | null; isCorrect: boolean } }>({});
  
  const [explanationPopup, setExplanationPopup] = useState<{ content: string; top: number; left: number } | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [adaptivePlan, setAdaptivePlan] = useState<AdaptiveFollowUp[] | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  
  const [studyNotes, setStudyNotes] = useState<string | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [notesCopied, setNotesCopied] = useState(false);
  const [practiceQuiz, setPracticeQuiz] = useState<QuestionPoolItem[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const [simulationModalContent, setSimulationModalContent] = useState<InteractiveSimulation | null>(null);
  const [isSubmittingToLMS, setIsSubmittingToLMS] = useState(false);
  const [isGeneratingRemediation, setIsGeneratingRemediation] = useState<number | null>(null);

  const hasInitialized = useRef(false);
  const prevLessonPackRef = useRef<LessonPack | null>(null);

  const isQuestionStep = (type: LessonStepType) => ['quick_check', 'fill_in_the_blanks', 'assessment_question'].includes(type);
  const isDetailsStep = (type: LessonStepType) => ['guided_practice', 'independent_practice', 'HOTS'].includes(type);

  const updateStepCompletionStatus = (index: number, currentSteps: LessonStep[], currentAnswers: typeof stepAnswers) => {
    const step = currentSteps[index];
    if (!step) {
        setIsStepCompleted(true);
        return;
    }
    if (isQuestionStep(step.type)) setIsStepCompleted(!!currentAnswers[index]);
    else if (isDetailsStep(step.type)) setIsStepCompleted(false);
    else setIsStepCompleted(true);
  };

  useEffect(() => {
    if (lessonPack && lessonPack !== prevLessonPackRef.current) {
        prevLessonPackRef.current = lessonPack;
        hasInitialized.current = false;
        
        const { grade, lastSubject, lastChapter } = activeProfile!;
        const chapterId = `G${grade}-${lastSubject}-${lastChapter}`;
        const chapterProgress = progressData[chapterId];
        
        const initialSteps = transformLessonPackToSteps(lessonPack);
        const initialStepIndex = (chapterProgress?.status !== 'completed' && chapterProgress?.currentStep) 
            ? Math.min(chapterProgress.currentStep, initialSteps.length > 0 ? initialSteps.length - 1 : 0) 
            : 0;
        
        setOriginalSteps(initialSteps);
        setSteps(initialSteps);
        setCurrentStepIndex(initialStepIndex);
        setStepAnswers({});
        setAssessmentResults([]);
        setAdaptivePlan(null);
        setStudyNotes(null);
        setPracticeQuiz(null);
        
        updateStepCompletionStatus(initialStepIndex, initialSteps, {});
    } else if (!lessonPack) {
        setSteps([]);
        setOriginalSteps([]);
    }
  }, [lessonPack, activeProfile, progressData]);

  useEffect(() => {
    if (hasInitialized.current && !ltiContext) updateChapterStep(currentStepIndex);
    else hasInitialized.current = true;
  }, [currentStepIndex, updateChapterStep, ltiContext]);

  const handleStepAnswer = async (stepIndex: number, answer: string | null, isCorrect: boolean, q_id?: string, question_text?: string) => {
      if (stepAnswers[stepIndex]) return;

      setStepAnswers(prev => ({ ...prev, [stepIndex]: { answer, isCorrect } }));
      if (lessonPack) recordAnswer(lessonPack.topic_id, isCorrect);
      if (q_id && question_text) setAssessmentResults(prev => [...prev, { q_id, question_text, is_correct: isCorrect }]);
      
      if (!isCorrect && lessonPack) {
        setIsGeneratingRemediation(stepIndex);
        try {
            const step = steps[stepIndex];
            
            let questionContent = '';
            if (step.type === 'quick_check') {
                questionContent = step.content.question;
            } else if (step.type === 'assessment_question') {
                questionContent = step.content.question.question;
            } else if (step.type === 'fill_in_the_blanks') {
                questionContent = step.content.sentence_parts.join(' ___ ');
            }

            if (questionContent) {
                const studentAnswer = answer || '';
                const remediationContent = await generateMicroRemediation(lessonPack.topic_name, questionContent, studentAnswer);
                
                if (remediationContent) {
                    const remediationExplanationStep: CoreExplanationStep = {
                        type: 'core_explanation',
                        title: "Let's Review That Concept",
                        content: remediationContent.explanation,
                        isRemediation: true,
                        originalIndex: step.originalIndex,
                    };
                    const remediationQuickCheckStep: QuickCheckStep = {
                        type: 'quick_check',
                        title: "Quick Check on Review",
                        content: remediationContent.quick_check,
                        isRemediation: true,
                        originalIndex: step.originalIndex,
                    };

                    setSteps(prevSteps => {
                        const newSteps = [...prevSteps];
                        newSteps.splice(stepIndex + 1, 0, remediationExplanationStep, remediationQuickCheckStep);
                        return newSteps;
                    });
                }
            }
        } catch (e) {
            console.error("Failed to generate micro-remediation", e);
        } finally {
            setIsGeneratingRemediation(null);
            setIsStepCompleted(true); // Allow user to proceed
        }
    } else {
        setIsStepCompleted(true);
    }
  };

  const goToNextStep = () => {
    setExplanationPopup(null);
    let nextStepIndex = currentStepIndex + 1;
    
    if (nextStepIndex < steps.length) {
      awardXP('step_completed');
      setCurrentStepIndex(nextStepIndex);
      updateStepCompletionStatus(nextStepIndex, steps, stepAnswers);
      if (nextStepIndex === steps.length - 1 && !ltiContext) {
        markChapterAsCompleted();
      }
    }
  };

  const goToPreviousStep = () => {
    setExplanationPopup(null);
    if (currentStepIndex > 0) {
      const prevStepIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevStepIndex);
      updateStepCompletionStatus(prevStepIndex, steps, stepAnswers);
    }
  };
  
  const handleSubmitToLMS = async () => {
      if (!ltiContext) return;
      setIsSubmittingToLMS(true);
      try {
          const correctAnswers = assessmentResults.filter(r => r.is_correct).length;
          const totalQuestions = assessmentResults.length;
          const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
          
          await ltiService.submitScore(ltiContext, score);
          alert(`Score of ${score.toFixed(0)} submitted to the LMS! You can now close this window.`);

      } catch (e) {
          console.error("LMS submission failed", e);
          alert("There was an error submitting your score to the LMS.");
      } finally {
          setIsSubmittingToLMS(false);
      }
  };

  const handleExplainSnippet = async (event: React.MouseEvent, snippet: string) => { /* ... */ };
  const handleGenerateNotes = async () => { /* ... */ };
  const handleGenerateQuiz = async () => { /* ... */ };
  const handleOpenSimulation = (content: InteractiveSimulation) => setSimulationModalContent(content);

  if (!lessonPack) return null;
  if (steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  const isFinalStepInLti = ltiContext && currentStepIndex === steps.length - 1;
  
  const renderStepContent = () => {
    if (!currentStep) return <div>Loading step...</div>;

    switch (currentStep.type) {
        case 'topic_title':
            return <TopicTitleStep content={currentStep.content} />;
        case 'core_explanation':
            return <CoreExplanationStepComponent content={currentStep.content} handleExplainSnippet={handleExplainSnippet} />;
        case 'quick_check':
            return <QuickCheckStepComponent 
                        content={currentStep.content}
                        stepAnswer={stepAnswers[currentStepIndex]} 
                        onStepAnswer={(answer, isCorrect) => handleStepAnswer(currentStepIndex, answer, isCorrect)} 
                        isGeneratingRemediation={isGeneratingRemediation === currentStepIndex}
                    />;
        case 'image_brief':
            return <ImageBriefStep content={currentStep.content} />;
        case 'worked_example':
            return <WorkedExampleStep content={currentStep.content} />;
        case 'guided_practice':
        case 'independent_practice':
            return <PracticeStep 
                        content={currentStep.content} 
                        type={currentStep.type} 
                        onCompleted={() => setIsStepCompleted(true)}
                    />;
        case 'HOTS':
            return <HOTSStep content={currentStep.content} onCompleted={() => setIsStepCompleted(true)} />;
        case 'common_error':
            return <CommonErrorStep content={currentStep.content} />;
        case 'fill_in_the_blanks':
            return <FillInTheBlanksStep 
                        content={currentStep.content}
                        stepAnswer={stepAnswers[currentStepIndex]} 
                        onStepAnswer={(answer, isCorrect) => handleStepAnswer(currentStepIndex, answer, isCorrect)} 
                    />;
        case 'interactive_simulation':
            return <InteractiveSimulationStep content={currentStep.content} onOpenSimulation={handleOpenSimulation} />;
        case 'interactive_video':
            return <Suspense fallback={<div>Loading Video...</div>}>
                        <InteractiveVideoStep 
                            content={currentStep.content} 
                            skillId={lessonPack!.topic_id}
                            onAnswer={recordAnswer}
                            onCompleted={() => setIsStepCompleted(true)}
                        />
                    </Suspense>;
        case 'assessment_intro':
            return <AssessmentIntroStep content={currentStep.content} />;
        case 'assessment_question':
            return <AssessmentQuestionStep 
                        content={currentStep.content} 
                        stepAnswer={stepAnswers[currentStepIndex]} 
                        onStepAnswer={(answer, isCorrect) => 
                            handleStepAnswer(currentStepIndex, answer, isCorrect, currentStep.content.question.q_id, currentStep.content.question.question)
                        } 
                        isGeneratingRemediation={isGeneratingRemediation === currentStepIndex}
                    />;
        case 'adaptive_intro':
            return <AdaptiveIntroStep assessmentResults={assessmentResults} />;
        case 'adaptive_follow_up':
            return <AdaptiveFollowUpStep content={currentStep.content} />;
        case 'feedback':
            return <FeedbackStep />;
        case 'key_term':
            return <KeyTermStep content={currentStep.content} />;
        case 'note':
            return <NoteStep content={currentStep.content} />;
        default:
            const _exhaustiveCheck: never = currentStep as never;
            return null;
    }
  };

  return (
    <div className="flex flex-col relative">
      {isTransitioning && (
        <div className="absolute inset-0 bg-white/70 z-20 transition-opacity duration-300">
            <div className="absolute top-0 left-0 h-1 w-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-indigo-500 animate-indeterminate-progress"></div>
            </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-slate-700">{lessonPack.topic_name}</h2>
          <span className="text-sm font-semibold text-slate-500">Step {currentStepIndex + 1} of {steps.length}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div className="bg-[var(--brand-primary)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div ref={contentRef} className="relative flex-grow p-6 bg-white rounded-xl shadow-lg border border-[var(--border-color)] mb-6">
         <div className="mb-4 pb-4 border-b border-slate-200">
            <TTSPlayer textToSpeak={getTextForTTS(currentStep)} />
         </div>
        <div key={currentStepIndex} className="animate-fade-in min-h-[400px]">
          {renderStepContent()}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={goToPreviousStep} disabled={currentStepIndex === 0} className="btn flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50">
          <ArrowLeftIcon className="w-5 h-5" /> Previous
        </button>
        {isFinalStepInLti ? (
            <button onClick={handleSubmitToLMS} disabled={isSubmittingToLMS} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">
              {isSubmittingToLMS ? "Submitting..." : "Submit Score to LMS"}
            </button>
        ) : (
            <button onClick={goToNextStep} disabled={currentStepIndex === steps.length - 1 || !isStepCompleted} className="btn btn-primary flex items-center gap-2">
              Next <ArrowRightIcon className="w-5 h-5" />
            </button>
        )}
      </div>

      {simulationModalContent && (
        <Suspense>
            <SimulationExplainerModal simulationContent={simulationModalContent} onClose={() => setSimulationModalContent(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default AdaptiveLessonPlayer;