import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Assignment, StudentSubmission, StudentSubmissionAnswer } from '../types';
import { XIcon, CheckCircleIcon, SparklesIcon } from '../constants/icons';
import { logFineTuningData } from '../services/fineTuningDataService';
import { gradeShortAnswer } from '../services/geminiService';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
}

const GradingModal: React.FC<GradingModalProps> = ({ isOpen, onClose, assignment }) => {
  const { userProfiles, allSubmissions, handleUpdateSubmission } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [gradedAnswers, setGradedAnswers] = useState<StudentSubmissionAnswer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiGrading, setIsAiGrading] = useState<string | null>(null);

  const studentsInClass = useMemo(() => {
    return assignment.assignedStudentIds && assignment.assignedStudentIds.length > 0
      ? userProfiles.filter(p => assignment.assignedStudentIds?.includes(p.id))
      : userProfiles.filter(p => p.grade === assignment.classGrade);
  }, [userProfiles, assignment]);

  const submissionsForAssignment = useMemo(() => {
    return allSubmissions.filter(s => s.assignmentId === assignment.id);
  }, [allSubmissions, assignment.id]);
  
  // For Distractor Analysis
  const mcqAnswerDistribution = useMemo(() => {
    const distribution: { [q_id: string]: { [option: string]: number } } = {};
    if (submissionsForAssignment.length === 0) return distribution;

    assignment.quizQuestions?.forEach(q => {
        if (q.type === 'MCQ' && q.options) {
            distribution[q.q_id] = {};
            q.options.forEach(opt => distribution[q.q_id][opt] = 0);

            submissionsForAssignment.forEach(sub => {
                const studentAnswer = sub.answers.find(a => a.q_id === q.q_id)?.answer;
                if (studentAnswer && distribution[q.q_id][studentAnswer] !== undefined) {
                    distribution[q.q_id][studentAnswer]++;
                }
            });
        }
    });
    return distribution;
  }, [submissionsForAssignment, assignment.quizQuestions]);

  if (!isOpen) return null;

  const handleSelectSubmission = (studentId: number) => {
    const submission = submissionsForAssignment.find(s => s.studentId === studentId);
    if (submission) {
      setSelectedSubmission(submission);
      setGradedAnswers(submission.answers.map(a => ({...a}))); // Deep copy for editing
    }
  };

  const handleMarkShortAnswer = (q_id: string, isCorrect: boolean) => {
    setGradedAnswers(prev => prev.map(ans => 
        ans.q_id === q_id ? { ...ans, isCorrect } : ans
    ));
  };
  
  const handleFeedbackChange = (q_id: string, feedback: string) => {
    setGradedAnswers(prev => prev.map(ans => 
        ans.q_id === q_id ? { ...ans, feedback } : ans
    ));
  };

  const handleAiGrade = async (q_id: string, question: string, rubric: string, studentAnswer: string) => {
    setIsAiGrading(q_id);
    try {
        const result = await gradeShortAnswer(question, rubric, studentAnswer);
        if (result) {
            handleMarkShortAnswer(q_id, result.isCorrect);
            handleFeedbackChange(q_id, result.feedback);
        }
    } catch (e) {
        console.error("AI grading failed", e);
        alert("AI grading failed. Please try again.");
    } finally {
        setIsAiGrading(null);
    }
  };

  const handleSaveGrade = () => {
    if (!selectedSubmission) return;
    setIsSaving(true);
    
    // Auto-grade MCQs, calculate score, and log data for fine-tuning
    let score = 0;
    const finalAnswers = gradedAnswers.map(ans => {
        const question = assignment.quizQuestions?.find(q => q.q_id === ans.q_id);
        let isCorrect = ans.isCorrect;
        if (question?.type === 'MCQ') {
            isCorrect = ans.answer === question.answer;
        }

        // Log data for fine-tuning if it's a short answer with feedback
        if (question && question.type === 'SA' && ans.feedback && ans.feedback.trim() !== '') {
            logFineTuningData({
                question: question.question,
                studentAnswer: ans.answer,
                teacherFeedback: ans.feedback
            });
        }

        if (isCorrect) score++;
        return { ...ans, isCorrect };
    });

    const updatedSubmission: StudentSubmission = {
        ...selectedSubmission,
        answers: finalAnswers,
        score,
        status: 'graded'
    };
    
    handleUpdateSubmission(updatedSubmission);
    setIsSaving(false);
    setSelectedSubmission(updatedSubmission); // Update local view to show it's graded
  };

  const renderStudentList = () => (
    <div>
      <h4 className="font-bold mb-2">Student Submissions</h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {studentsInClass.map(student => {
          const submission = submissionsForAssignment.find(s => s.studentId === student.id);
          let status: 'Submitted' | 'Graded' | 'Not Submitted' = 'Not Submitted';
          if (submission) status = submission.status === 'graded' ? 'Graded' : 'Submitted';

          return (
            <button key={student.id} onClick={() => handleSelectSubmission(student.id)} disabled={!submission} className="w-full text-left p-3 bg-slate-50 rounded-lg border flex justify-between items-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <div>
                <p className="font-semibold">{student.name}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : status === 'Submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                {status}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  );

  const renderGradingView = () => {
    if (!selectedSubmission) return null;
    const student = userProfiles.find(p => p.id === selectedSubmission.studentId);
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => setSelectedSubmission(null)} className="text-sm font-semibold text-indigo-600 hover:underline">&larr; Back to List</button>
            <h4 className="font-bold">Grading: {student?.name}</h4>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {assignment.quizQuestions?.map((q, index) => {
                const answer = gradedAnswers.find(a => a.q_id === q.q_id);
                if (!answer) return null;

                const isMcqCorrect = q.type === 'MCQ' && answer.answer === q.answer;

                return (
                    <div key={q.q_id} className="p-4 bg-slate-50 rounded-lg border">
                        <p className="font-semibold">{index + 1}. {q.question}</p>
                        <p className="mt-2 text-sm text-slate-500">Student's Answer:</p>
                        <p className="p-2 bg-white rounded border font-mono text-sm">{answer.answer || '(No answer)'}</p>

                        {q.type === 'MCQ' && (
                             <div className="mt-2 text-sm">
                                 <p className={`font-bold ${isMcqCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {isMcqCorrect ? 'Correct' : 'Incorrect'}. Correct answer: {q.answer}
                                 </p>
                                 <div className="text-xs text-slate-500 mt-2 space-y-1">
                                    <p className="font-bold text-slate-600">Class Response Distribution:</p>
                                    {q.options?.map(opt => {
                                        const count = mcqAnswerDistribution[q.q_id]?.[opt] || 0;
                                        const percentage = submissionsForAssignment.length > 0 ? Math.round((count / submissionsForAssignment.length) * 100) : 0;
                                        const isCorrectOption = opt === q.answer;
                                        return <div key={opt} className="flex items-center gap-2">
                                            <div className={`w-20 truncate font-semibold ${isCorrectOption ? 'text-emerald-700' : ''}`}>{opt}</div>
                                            <div className="w-full bg-slate-200 rounded-full h-2"><div className={`${isCorrectOption ? 'bg-emerald-500' : 'bg-slate-400'} h-2 rounded-full`} style={{width: `${percentage}%`}}></div></div>
                                            <div className="w-10 text-right font-mono">{percentage}%</div>
                                        </div>
                                    })}
                                 </div>
                             </div>
                        )}

                        {q.type === 'SA' && (
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => handleMarkShortAnswer(q.q_id, true)} className={`btn text-sm px-3 py-1 ${answer.isCorrect === true ? 'bg-emerald-500 text-white' : 'bg-white border'}`}>Correct</button>
                                <button onClick={() => handleMarkShortAnswer(q.q_id, false)} className={`btn text-sm px-3 py-1 ${answer.isCorrect === false ? 'bg-red-500 text-white' : 'bg-white border'}`}>Incorrect</button>
                                <button onClick={() => handleAiGrade(q.q_id, q.question, q.rubric, answer.answer)} disabled={isAiGrading === q.q_id} className="btn text-sm px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center gap-1">
                                    <SparklesIcon className="w-4 h-4" />
                                    {isAiGrading === q.q_id ? 'Grading...' : 'AI Grade Assist'}
                                </button>
                            </div>
                        )}
                        
                        <textarea value={answer.feedback || ''} onChange={(e) => handleFeedbackChange(q.q_id, e.target.value)} placeholder="Add feedback (optional)..." rows={2} className="form-textarea w-full text-sm mt-2" />
                    </div>
                )
            })}
        </div>
        <div className="mt-4">
            {selectedSubmission.status !== 'graded' ? (
                <button onClick={handleSaveGrade} disabled={isSaving} className="btn btn-primary w-full">
                    {isSaving ? "Saving..." : "Save Grade & Feedback"}
                </button>
            ) : (
                <div className="text-center p-3 bg-emerald-100 text-emerald-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5"/> Already Graded (Score: {selectedSubmission.score}/{assignment.quizQuestions?.length})
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Grade Quiz: {assignment.title}</h3>
          <button onClick={onClose} className="p-1"><XIcon className="w-5 h-5" /></button>
        </div>
        {selectedSubmission ? renderGradingView() : renderStudentList()}
      </div>
    </div>
  );
};

export default GradingModal;