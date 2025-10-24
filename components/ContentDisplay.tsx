import React, { useState, useRef, useEffect, Suspense } from 'react';
import { LessonPack, AssessmentResult, AdaptiveFollowUp, LessonStep, LessonStepType, QuestionPoolItem, InteractiveSimulation } from '../types';
import { generateAdaptiveFollowUp, generateStudyNotes, generatePracticeQuiz, explainTextSnippet } from '../services/geminiService';
import { transformLessonPackToSteps } from '../utils/lessonHelpers';
import { SparklesIcon, TargetIcon, ArrowLeftIcon, ArrowRightIcon, BookIcon, FileTextIcon, ClipboardCopyIcon, ClipboardListIcon, CheckCircleIcon, ChevronDownIcon } from '../constants/icons';
import { useStudentData } from '../contexts/StudentDataContext';
import { useAuth } from '../contexts/AuthContext';

// Import all the new step components
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


interface ContentDisplayProps {
  lessonPack: LessonPack | null;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ lessonPack }) => {
  const { activeProfile } = useAuth();
  const { progressData, markChapterAsCompleted, awardXP, recordAnswer, updateChapterStep } = useStudentData();
  const [steps, setSteps] = useState<LessonStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepCompleted, setIsStepCompleted] = useState(true);

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

  const isStepGated = (stepType: LessonStepType) => {
    return ['guided_practice', 'independent_practice', 'fill_in_the_blanks', 'quick_check', 'HOTS'].includes(stepType);
  };

  // Effect to initialize state when a new lesson is loaded
  useEffect(() => {
    hasInitialized.current = false; // Reset initialization flag for the new lesson
    if (lessonPack && activeProfile) {
        const { grade, lastSubject, lastChapter } = activeProfile;
        const chapterId = `G${grade}-${lastSubject}-${lastChapter}`;
        const chapterProgress = progressData[chapterId];
        
        const newSteps = transformLessonPackToSteps(lessonPack);
        const initialStep = (chapterProgress?.status !== 'completed' && chapterProgress?.currentStep) 
            ? Math.min(chapterProgress.currentStep, newSteps.length > 0 ? newSteps.length - 1 : 0) 
            : 0;
        
        setSteps(newSteps);
        setCurrentStepIndex(initialStep);
        
        // Reset other component-specific states for the new lesson
        setAssessmentResults([]);
        setAdaptivePlan(null);
        setIsGeneratingPlan(false);
        setStudyNotes(null);
        setIsGeneratingNotes(false);
        setPracticeQuiz(null);
        setIsGeneratingQuiz(false);
        setNotesCopied(false);
        
        const firstStepIsGated = newSteps.length > 0 && isStepGated(newSteps[initialStep]?.type);
        setIsStepCompleted(!firstStepIsGated);
    } else {
        setSteps([]);
    }
  }, [lessonPack, activeProfile, progressData]);

  // Effect to save progress when step changes, AFTER initialization
  useEffect(() => {
    if (hasInitialized.current) {
        updateChapterStep(currentStepIndex);
    } else {
        // After the first render with the new step index, mark as initialized
        hasInitialized.current = true;
    }
  }, [currentStepIndex, updateChapterStep]);

  useEffect(() => {
    if (steps[currentStepIndex]?.type === 'adaptive_intro' && !adaptivePlan && !isGeneratingPlan) {
      const hasIncorrectAnswers = assessmentResults.some(result => !result.is_correct);
      
      const generateAndInjectPlan = async () => {
        setIsGeneratingPlan(true);
        try {
          const plan = await generateAdaptiveFollowUp(assessmentResults);
          setAdaptivePlan(plan);

          if (plan && plan.length > 0) {
            const adaptiveSteps: LessonStep[] = plan.map(item => ({ type: 'adaptive_follow_up', title: 'Adaptive Follow-up', content: item }));
            setSteps(prevSteps => {
              const introIndex = prevSteps.findIndex(step => step.type === 'adaptive_intro');
              if (introIndex !== -1) {
                const newSteps = [...prevSteps];
                newSteps.splice(introIndex + 1, 0, ...adaptiveSteps); // Insert after intro
                return newSteps;
              }
              return prevSteps;
            });
          } else {
            const feedbackIndex = steps.findIndex(step => step.type === 'feedback');
            if (feedbackIndex !== -1) {
              setCurrentStepIndex(feedbackIndex);
            }
          }
        } catch (error) {
          console.error("Failed to generate adaptive plan:", error);
           const feedbackIndex = steps.findIndex(step => step.type === 'feedback');
            if (feedbackIndex !== -1) setCurrentStepIndex(feedbackIndex);
        } finally {
          setIsGeneratingPlan(false);
        }
      };

      if (hasIncorrectAnswers) {
        generateAndInjectPlan();
      } else {
        setTimeout(() => {
            const feedbackIndex = steps.findIndex(step => step.type === 'feedback');
            if (feedbackIndex !== -1) {
                setCurrentStepIndex(feedbackIndex);
            }
        }, 1500);
      }
    }
  }, [currentStepIndex, steps, assessmentResults, adaptivePlan, isGeneratingPlan]);

  const handleExplainSnippet = async (event: React.MouseEvent, snippet: string) => {
      if (!lessonPack || !activeProfile) return;
      const button = event.currentTarget as HTMLElement;
      const contentArea = contentRef.current;
      if (!contentArea) return;

      if (explanationPopup) {
          setExplanationPopup(null);
          return;
      }

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

  const handleAnswerSubmit = (q_id: string, question_text: string, is_correct: boolean) => {
    // This is specifically for the end-of-lesson assessment to generate adaptive follow-ups
    setAssessmentResults(prevResults => {
      if (prevResults.some(r => r.q_id === q_id)) return prevResults;
      return [...prevResults, { q_id, question_text, is_correct }];
    });
    // This now also records the answer for BKT
    if (lessonPack) {
      recordAnswer(lessonPack.topic_id, is_correct);
    }
  };

  const handleGenericAnswer = (skillId: string, isCorrect: boolean) => {
    recordAnswer(skillId, isCorrect);
  };

  const handleGenerateNotes = async () => {
    if (!lessonPack) return;
    setIsGeneratingNotes(true);
    setStudyNotes(null);
    try {
      const notes = await generateStudyNotes(lessonPack.student_explanation, lessonPack.topic_name);
      setStudyNotes(notes);
    } catch (error) {
      console.error("Failed to generate study notes:", error);
      setStudyNotes("Sorry, an error occurred while generating notes.");
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleCopyNotes = () => {
    if (studyNotes) {
      navigator.clipboard.writeText(studyNotes).then(() => {
        setNotesCopied(true);
        setTimeout(() => setNotesCopied(false), 2000);
      });
    }
  };

  const handleGenerateQuiz = async () => {
    if (!lessonPack) return;
    setIsGeneratingQuiz(true);
    setPracticeQuiz(null);
    try {
      const quiz = await generatePracticeQuiz(lessonPack.student_explanation, lessonPack.topic_name);
      setPracticeQuiz(quiz);
    } catch(error) {
      console.error("Failed to generate practice quiz:", error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  const handleOpenSimulation = (content: InteractiveSimulation) => {
    setSimulationModalContent(content);
  };

  const goToNextStep = () => {
    setExplanationPopup(null);
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      awardXP('step_completed');
      setCurrentStepIndex(nextStepIndex);
      const nextStep = steps[nextStepIndex];
      setIsStepCompleted(!isStepGated(nextStep.type));
      if (nextStepIndex === steps.length - 1) {
        markChapterAsCompleted();
      }
    }
  };

  const goToPreviousStep = () => {
    setExplanationPopup(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsStepCompleted(true);
    }
  };

  if (!lessonPack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <BookIcon className="h-24 w-24 mb-4 text-slate-300"/>
        <h2 className="text-2xl font-bold text-slate-700">Welcome to Alfanumrik</h2>
        <p className="mt-2 max-w-md">Select a grade, subject, and chapter from the navigation to begin your learning journey. We'll craft a personalized lesson just for you!</p>
      </div>
    );
  }

  if (steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  const skillId = lessonPack.topic_id;

  const stepComponents: { [key in LessonStepType]?: React.FC<any> } = {
    'topic_title': TopicTitleStep,
    'core_explanation': CoreExplanationStep,
    'quick_check': QuickCheckStep,
    'image_brief': ImageBriefStep,
    'worked_example': WorkedExampleStep,
    'guided_practice': PracticeStep,
    'independent_practice': PracticeStep,
    'HOTS': HOTSStep,
    'common_error': CommonErrorStep,
    'fill_in_the_blanks': FillInTheBlanksStep,
    'interactive_simulation': InteractiveSimulationStep,
    'interactive_video': InteractiveVideoStep,
    'assessment_intro': AssessmentIntroStep,
    'assessment_question': AssessmentQuestionStep,
    'adaptive_intro': AdaptiveIntroStep,
    'adaptive_follow_up': AdaptiveFollowUpStep,
    'feedback': FeedbackStep,
    'key_term': KeyTermStep,
    'note': NoteStep
  };

  const StepComponent = currentStep ? stepComponents[currentStep.type] : null;

  return (
    <div className="flex flex-col h-full">
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
          {StepComponent ? (
            <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
              <StepComponent
                content={currentStep.content}
                type={currentStep.type}
                onCompleted={() => setIsStepCompleted(true)}
                onAnswerSubmit={handleAnswerSubmit}
                handleExplainSnippet={handleExplainSnippet}
                assessmentResults={assessmentResults}
                onOpenSimulation={handleOpenSimulation}
                skillId={skillId}
                onAnswer={handleGenericAnswer}
              />
            </Suspense>
          ) : <div>Loading step...</div>}
        </div>
        {explanationPopup && (
            <div 
                className="absolute z-20 p-3 bg-slate-800 text-white rounded-lg shadow-xl border border-slate-700 w-64 animate-fade-in text-sm" 
                style={{ top: explanationPopup.top, left: explanationPopup.left, transform: 'translateX(-50%)' }}
            >
                 <button onClick={() => setExplanationPopup(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-slate-600 rounded-full text-white text-xs leading-none">&times;</button>
                {isExplaining 
                    ? <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white mx-auto"></div> 
                    : <p>{explanationPopup.content}</p>
                }
            </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          className="btn flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={goToNextStep}
          disabled={currentStepIndex === steps.length - 1 || !isStepCompleted}
          className="btn btn-primary flex items-center gap-2"
        >
          Next
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>

      {currentStepIndex === steps.length - 1 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-xl shadow-lg border border-[var(--border-color)]">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-4">
                      <FileTextIcon className="w-6 h-6 text-[var(--brand-primary)]" />
                      AI Study Notes
                  </h3>
                  <p className="text-slate-600 mb-4 text-sm">Get a concise summary of this lesson for quick revision.</p>
                  <button onClick={handleGenerateNotes} disabled={isGeneratingNotes} className="btn btn-primary w-full">
                      {isGeneratingNotes ? 'Generating...' : 'Generate Study Notes'}
                  </button>
                  {isGeneratingNotes && <div className="text-center mt-4"><div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-[var(--brand-primary)] mx-auto"></div></div>}
                  {studyNotes && (
                      <details className="mt-4 group">
                          <summary className="cursor-pointer font-semibold text-slate-700 bg-slate-100 p-3 rounded-lg list-none flex justify-between items-center hover:bg-slate-200 transition-colors">
                              <span>View Generated Notes</span>
                              <ChevronDownIcon className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="mt-[-1px] p-4 bg-slate-50 border border-slate-200 rounded-b-lg max-h-60 overflow-y-auto relative">
                              <button onClick={handleCopyNotes} className="absolute top-3 right-3 p-1.5 bg-slate-200 rounded-md hover:bg-slate-300 z-10">
                                  {notesCopied ? <CheckCircleIcon className="w-4 h-4 text-emerald-600"/> : <ClipboardCopyIcon className="w-4 h-4 text-slate-600"/>}
                                  <span className="sr-only">Copy notes</span>
                              </button>
                              <div className="prose prose-sm prose-slate whitespace-pre-wrap pr-8">{studyNotes}</div>
                              {notesCopied && <div className="absolute bottom-3 right-3 text-xs bg-slate-800 text-white px-2 py-1 rounded">Copied!</div>}
                          </div>
                      </details>
                  )}
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg border border-[var(--border-color)]">
                   <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-4">
                      <ClipboardListIcon className="w-6 h-6 text-purple-600" />
                      Practice Quiz
                  </h3>
                  <p className="text-slate-600 mb-4 text-sm">Test your knowledge with a new set of AI-generated questions.</p>
                  <button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz} className="btn btn-primary w-full bg-purple-600 hover:bg-purple-700">
                      {isGeneratingQuiz ? 'Generating...' : 'Generate Practice Quiz'}
                  </button>
                  {isGeneratingQuiz && <div className="text-center mt-4"><div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-purple-600 mx-auto"></div></div>}
                  {practiceQuiz && (
                      <div className="mt-4 max-h-60 overflow-y-auto space-y-4">
                        {practiceQuiz.map((q, index) => (
                           <details key={q.q_id} className="bg-slate-50 p-3 rounded-lg border">
                             <summary className="font-semibold text-sm cursor-pointer">Q{index + 1}: {q.question}</summary>
                             <div className="mt-2 pt-2 border-t text-sm">
                               <p><strong className="text-slate-600">Answer:</strong> {q.answer}</p>
                               <p className="mt-1"><strong className="text-slate-600">Rubric:</strong> {q.rubric}</p>
                             </div>
                           </details>
                        ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {simulationModalContent && (
        <Suspense>
            <SimulationExplainerModal
                simulationContent={simulationModalContent}
                onClose={() => setSimulationModalContent(null)}
            />
        </Suspense>
      )}
    </div>
  );
};

export default ContentDisplay;