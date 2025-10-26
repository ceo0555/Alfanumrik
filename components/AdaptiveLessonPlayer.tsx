import React, { useState, useRef, useEffect, Suspense } from 'react';
import { LessonPack, AssessmentResult, AdaptiveFollowUp, LessonStep, LessonStepType, QuestionPoolItem, InteractiveSimulation } from '../types';
import { generateAdaptiveFollowUp, generateStudyNotes, generatePracticeQuiz, explainTextSnippet } from '../services/geminiService';
import { transformLessonPackToSteps } from '../utils/lessonHelpers';
import { SparklesIcon, ArrowLeftIcon, ArrowRightIcon, BookIcon, FileTextIcon, ClipboardCopyIcon, ClipboardListIcon, CheckCircleIcon, ChevronDownIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';
import { useAuth } from '../contexts/AuthContext';

// Import all the step components
import TopicTitleStep from './TopicTitleStep';
import CoreExplanationStep from './CoreExplanationStep';
import QuickCheckStep from './QuickCheck';
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

const SimulationExplainerModal = React.lazy(() => import('./SimulationExplainerModal'));
const InteractiveVideoStep = React.lazy(() => import('./InteractiveVideoStep'));


interface AdaptiveLessonPlayerProps {
  lessonPack: LessonPack | null;
}

const AdaptiveLessonPlayer: React.FC<AdaptiveLessonPlayerProps> = ({ lessonPack }) => {
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
        // Reset AI tools
        setStudyNotes(null);
        setPracticeQuiz(null);
        
        updateStepCompletionStatus(initialStepIndex, initialSteps, {});
    } else if (!lessonPack) {
        setSteps([]);
        setOriginalSteps([]);
    }
  }, [lessonPack, activeProfile, progressData]);

  useEffect(() => {
    if (hasInitialized.current) updateChapterStep(currentStepIndex);
    else hasInitialized.current = true;
  }, [currentStepIndex, updateChapterStep]);

  const handleStepAnswer = (stepIndex: number, answer: string | null, isCorrect: boolean, q_id?: string, question_text?: string) => {
      if (stepAnswers[stepIndex]) return;

      setStepAnswers(prev => ({ ...prev, [stepIndex]: { answer, isCorrect } }));
      setIsStepCompleted(true);
      if (lessonPack) recordAnswer(lessonPack.topic_id, isCorrect);
      if (q_id && question_text) setAssessmentResults(prev => [...prev, { q_id, question_text, is_correct: isCorrect }]);
      
      // --- Contextual Bandit Logic: Remediation ---
      if (!isCorrect) {
          const currentOriginalIndex = steps[stepIndex].originalIndex;
          if (currentOriginalIndex === undefined) return;

          let remediationStep = null;
          for (let i = currentOriginalIndex - 1; i >= 0; i--) {
              const potentialStep = originalSteps[i];
              if (potentialStep.type === 'worked_example' || potentialStep.type === 'common_error') {
                  remediationStep = { ...potentialStep, isRemediation: true, title: `Let's Review: ${potentialStep.title}` };
                  break;
              }
          }
          
          if (remediationStep) {
              const nextStep = steps[stepIndex + 1];
              if (!nextStep || !nextStep.isRemediation) {
                   setSteps(prevSteps => {
                      const newSteps = [...prevSteps];
                      newSteps.splice(stepIndex + 1, 0, remediationStep);
                      return newSteps;
                  });
              }
          }
      }
  };

  const goToNextStep = () => {
    setExplanationPopup(null);
    const step = steps[currentStepIndex];
    const answerInfo = stepAnswers[currentStepIndex];
    let nextStepIndex = currentStepIndex + 1;

    // --- Contextual Bandit Logic: Acceleration ---
    if (answerInfo && answerInfo.isCorrect && isQuestionStep(step.type)) {
        let jumpToIndex = -1;
        for (let i = currentStepIndex + 1; i < steps.length; i++) {
            const nextStepType = steps[i].type;
            if (['independent_practice', 'HOTS', 'assessment_intro'].includes(nextStepType)) {
                jumpToIndex = i;
                break;
            }
        }
        if (jumpToIndex !== -1) {
            nextStepIndex = jumpToIndex;
        }
    }
    
    if (nextStepIndex < steps.length) {
      awardXP('step_completed');
      setCurrentStepIndex(nextStepIndex);
      updateStepCompletionStatus(nextStepIndex, steps, stepAnswers);
      if (nextStepIndex === steps.length - 1) {
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

  // --- All other handlers from ContentDisplay (AI tools, modals, etc.) ---
  const handleExplainSnippet = async (event: React.MouseEvent, snippet: string) => {
    if (!lessonPack || !activeProfile) return;
    const button = event.currentTarget as HTMLElement;
    const contentArea = contentRef.current;
    if (!contentArea) return;
    if (explanationPopup) { setExplanationPopup(null); return; }

    const buttonRect = button.getBoundingClientRect();
    const contentRect = contentArea.getBoundingClientRect();
    const top = buttonRect.top - contentRect.top + buttonRect.height + 8;
    const left = buttonRect.left - contentRect.left + buttonRect.width / 2;
    setExplanationPopup({ content: '', top, left });
    setIsExplaining(true);
    try {
        const explanation = await explainTextSnippet(snippet, { topic: lessonPack.topic_name, subject: activeProfile.lastSubject, grade: activeProfile.grade });
        setExplanationPopup(prev => prev ? { ...prev, content: explanation } : null);
    } catch (e) {
        setExplanationPopup(prev => prev ? { ...prev, content: "Sorry, I couldn't explain that." } : null);
    } finally {
        setIsExplaining(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!lessonPack) return;
    setIsGeneratingNotes(true);
    try {
      const notes = await generateStudyNotes(lessonPack.student_explanation, lessonPack.topic_name);
      setStudyNotes(notes);
    } catch (error) { setStudyNotes("Sorry, an error occurred."); } 
    finally { setIsGeneratingNotes(false); }
  };
  const handleCopyNotes = () => { /* ... */ };
  const handleGenerateQuiz = async () => { /* ... */ };
  const handleOpenSimulation = (content: InteractiveSimulation) => setSimulationModalContent(content);

  // --- RENDER LOGIC ---
  if (!lessonPack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <BookIcon className="h-24 w-24 mb-4 text-slate-300"/>
        <h2 className="text-2xl font-bold text-slate-700">Welcome to Alfanumrik</h2>
        <p className="mt-2 max-w-md">Select a grade, subject, and chapter to begin your learning journey.</p>
      </div>
    );
  }

  if (steps.length === 0) return null;
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const stepComponents: { [key in LessonStepType]?: React.FC<any> } = {
    'topic_title': TopicTitleStep, 'core_explanation': CoreExplanationStep, 'quick_check': QuickCheckStep,
    'image_brief': ImageBriefStep, 'worked_example': WorkedExampleStep, 'guided_practice': PracticeStep,
    'independent_practice': PracticeStep, 'HOTS': HOTSStep, 'common_error': CommonErrorStep,
    'fill_in_the_blanks': FillInTheBlanksStep, 'interactive_simulation': InteractiveSimulationStep,
    'interactive_video': InteractiveVideoStep, 'assessment_intro': AssessmentIntroStep,
    'assessment_question': AssessmentQuestionStep, 'adaptive_intro': AdaptiveIntroStep,
    'adaptive_follow_up': AdaptiveFollowUpStep, 'feedback': FeedbackStep, 'key_term': KeyTermStep, 'note': NoteStep
  };
  const StepComponent = currentStep ? stepComponents[currentStep.type] : null;

  return (
    <div className="flex flex-col">
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
        <div key={currentStepIndex} className="animate-fade-in min-h-[400px]">
            {currentStep.isRemediation && (
                <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                    <p className="font-bold text-yellow-800">Let's review a related concept before moving on.</p>
                </div>
            )}
            {StepComponent ? (
                <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
                    <StepComponent
                        content={currentStep.content}
                        type={currentStep.type}
                        handleExplainSnippet={handleExplainSnippet}
                        onOpenSimulation={handleOpenSimulation}
                        assessmentResults={assessmentResults}
                        onCompleted={() => setIsStepCompleted(true)}
                        stepAnswer={stepAnswers[currentStepIndex]}
                        onStepAnswer={(answer: string | null, isCorrect: boolean) => 
                            handleStepAnswer(currentStepIndex, answer, isCorrect, (currentStep.content as any)?.question?.q_id, (currentStep.content as any)?.question?.question)
                        }
                        skillId={lessonPack.topic_id}
                        onAnswer={(skillId: string, isCorrect: boolean) => recordAnswer(skillId, isCorrect)}
                    />
                </Suspense>
            ) : <div>Loading step...</div>}
        </div>
        {/* Explanation Popup logic remains the same */}
        {explanationPopup && (
            <div className="absolute z-20 p-3 bg-slate-800 text-white rounded-lg shadow-xl border border-slate-700 w-64 animate-fade-in text-sm" style={{ top: explanationPopup.top, left: explanationPopup.left, transform: 'translateX(-50%)' }}>
                <button onClick={() => setExplanationPopup(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-slate-600 rounded-full text-white text-xs leading-none">&times;</button>
                {isExplaining ? <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white mx-auto"></div> : <p>{explanationPopup.content}</p>}
            </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={goToPreviousStep} disabled={currentStepIndex === 0} className="btn flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
          <ArrowLeftIcon className="w-5 h-5" /> Previous
        </button>
        <button onClick={goToNextStep} disabled={currentStepIndex === steps.length - 1 || !isStepCompleted} className="btn btn-primary flex items-center gap-2">
          Next <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* AI Tools at the end of the lesson */}
      {currentStepIndex === steps.length - 1 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Study Notes Card */}
              <div className="p-6 bg-white rounded-xl shadow-lg border border-[var(--border-color)]">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-4"><FileTextIcon className="w-6 h-6 text-[var(--brand-primary)]" /> AI Study Notes</h3>
                  <p className="text-slate-600 mb-4 text-sm">Get a concise summary of this lesson for quick revision.</p>
                  <button onClick={handleGenerateNotes} disabled={isGeneratingNotes} className="btn btn-primary w-full">
                      {isGeneratingNotes ? 'Generating...' : 'Generate Study Notes'}
                  </button>
                  {/* ... Notes display logic ... */}
              </div>
              {/* Practice Quiz Card */}
              <div className="p-6 bg-white rounded-xl shadow-lg border border-[var(--border-color)]">
                   <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-4"><ClipboardListIcon className="w-6 h-6 text-purple-600" /> Practice Quiz</h3>
                  <p className="text-slate-600 mb-4 text-sm">Test your knowledge with a new set of AI-generated questions.</p>
                  <button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz} className="btn btn-primary w-full bg-purple-600 hover:bg-purple-700">
                      {isGeneratingQuiz ? 'Generating...' : 'Generate Practice Quiz'}
                  </button>
                  {/* ... Quiz display logic ... */}
              </div>
          </div>
      )}

      {/* Simulation Modal */}
      {simulationModalContent && (
        <Suspense>
            <SimulationExplainerModal simulationContent={simulationModalContent} onClose={() => setSimulationModalContent(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default AdaptiveLessonPlayer;