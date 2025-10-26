import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentData } from '../contexts/StudentDataContext';
import { View } from '../App';
import { ClipboardListIcon, CheckCircleIcon, ArrowRightIcon } from '../constants/icons';
import { Assignment, StudentSubmission } from '../types';

const QuizResultsModal = React.lazy(() => import('./QuizResultsModal'));

interface StudentAssignmentsProps {
  setView: (view: View) => void;
  onStartQuiz: (assignment: Assignment) => void;
}

const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ setView, onStartQuiz }) => {
  const { activeProfile, allAssignments, allSubmissions, updateActiveUserProfile } = useAuth();
  const { progressData } = useStudentData();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [resultsToShow, setResultsToShow] = useState<{ assignment: Assignment, submission: StudentSubmission } | null>(null);

  const studentAssignments = useMemo(() => {
    if (!activeProfile) return [];
    return allAssignments.filter(assignment => {
        if (assignment.classGrade !== activeProfile.grade) return false;
        
        const isForAll = !assignment.assignedStudentIds || assignment.assignedStudentIds.length === 0;
        const isForStudent = assignment.assignedStudentIds?.includes(activeProfile.id);
        return isForAll || isForStudent;
    });
  }, [allAssignments, activeProfile]);
  
  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.assignmentType === 'quiz') {
        const submission = allSubmissions.find(s => s.assignmentId === assignment.id && s.studentId === activeProfile?.id);
        if (submission?.status === 'graded') return 'completed';
        if (submission?.status === 'submitted') return 'submitted';
        return new Date(assignment.dueDate) < new Date() ? 'overdue' : 'active';
    } else {
        const isCompleted = assignment.assignedChapterIds.every(
            chapterId => progressData[chapterId]?.status === 'completed'
        );
        if (isCompleted) return 'completed';
        return new Date(assignment.dueDate) < new Date() ? 'overdue' : 'active';
    }
  };

  const { active, completed } = useMemo(() => {
    const active: Assignment[] = [];
    const completed: Assignment[] = [];
    
    studentAssignments.forEach(assignment => {
        const status = getAssignmentStatus(assignment);
        if (status === 'completed') {
            completed.push(assignment);
        } else {
            active.push(assignment);
        }
    });
    
    return { active, completed };
  }, [studentAssignments, progressData, allSubmissions]);
  
  const handleChapterClick = (chapterId: string) => {
    const [, grade, subject, ...chapterParts] = chapterId.split('-');
    const chapter = chapterParts.join('-');
    
    updateActiveUserProfile({
        lastChapter: chapter,
        lastSubject: subject,
        grade: grade,
    });
    setView('lesson');
  };

  const AssignmentCard: React.FC<{ assignment: Assignment }> = ({ assignment }) => {
    const status = getAssignmentStatus(assignment);
    const isOverdue = status === 'overdue';
    
    const submission = assignment.assignmentType === 'quiz' 
        ? allSubmissions.find(s => s.assignmentId === assignment.id && s.studentId === activeProfile?.id)
        : null;

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800">{assignment.title}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                    Due: {new Date(assignment.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
            </div>
            {assignment.instructions && (
                <p className="text-sm text-slate-500 mt-2 border-l-2 border-slate-200 pl-2">{assignment.instructions}</p>
            )}
            <div className="mt-4">
                {assignment.assignmentType === 'chapters' ? (
                    <>
                        <h4 className="text-sm font-semibold text-slate-600 mb-2">Assigned Chapters:</h4>
                        <div className="space-y-2">
                            {assignment.assignedChapterIds.map(chapterId => {
                                const [, , subject, ...chapterParts] = chapterId.split('-');
                                const chapter = chapterParts.join('-');
                                const isChapterCompleted = progressData[chapterId]?.status === 'completed';
                                return (
                                    <button 
                                        key={chapterId} 
                                        onClick={() => handleChapterClick(chapterId)}
                                        className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isChapterCompleted ? <CheckCircleIcon className="w-5 h-5 text-emerald-500"/> : <div className="w-5 h-5 flex-shrink-0"><div className="w-3 h-3 mt-1 ml-1 rounded-full bg-slate-300"/></div>}
                                            <div>
                                                <p className="text-sm font-medium text-left">{chapter}</p>
                                                <p className="text-xs text-slate-400 text-left">{subject}</p>
                                            </div>
                                        </div>
                                        <ArrowRightIcon className="w-5 h-5 text-slate-400" />
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="mt-4">
                        {status === 'completed' && submission ? (
                            <button onClick={() => setResultsToShow({ assignment, submission })} className="btn btn-primary w-full bg-emerald-600 hover:bg-emerald-700">View Results (Score: {submission.score}/{assignment.quizQuestions?.length})</button>
                        ) : status === 'submitted' ? (
                            <div className="text-center p-3 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600">Submitted for Grading</div>
                        ) : (
                            <button onClick={() => onStartQuiz(assignment)} className="btn btn-primary w-full">Start Quiz ({assignment.quizQuestions?.length} Questions)</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
  };

  const assignmentsToShow = activeTab === 'active' ? active : completed;

  return (
    <div className="animate-slide-in-up">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-4">My Assignments</h1>

        <div className="border-b border-slate-200 mb-6">
            <div className="flex items-center -mb-px">
                <button onClick={() => setActiveTab('active')} className={`px-4 py-2 font-semibold text-sm border-b-2 ${activeTab === 'active' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    Active ({active.length})
                </button>
                <button onClick={() => setActiveTab('completed')} className={`px-4 py-2 font-semibold text-sm border-b-2 ${activeTab === 'completed' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    Completed ({completed.length})
                </button>
            </div>
        </div>
        
        {assignmentsToShow.length > 0 ? (
            <div className="space-y-4">
                {assignmentsToShow.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(assignment => <AssignmentCard key={assignment.id} assignment={assignment} />)}
            </div>
        ) : (
            <div className="text-center py-12 text-slate-500">
                <ClipboardListIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="font-semibold text-slate-600">No {activeTab} assignments.</p>
                {activeTab === 'active' && <p>You're all caught up!</p>}
            </div>
        )}

        {resultsToShow && (
          <Suspense fallback={<div/>}>
              <QuizResultsModal 
                  isOpen={!!resultsToShow}
                  onClose={() => setResultsToShow(null)}
                  assignment={resultsToShow.assignment}
                  submission={resultsToShow.submission}
              />
          </Suspense>
        )}
    </div>
  );
};

export default StudentAssignments;