import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { XIcon, ClipboardListIcon, ChevronDownIcon, PlusIcon } from '../constants/icons';
import { QuestionPoolItem } from '../types';
import { curriculum } from '../constants/curriculum';
import AddQuestionModal from './AddQuestionModal';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: string;
  initialData?: {
    studentIds?: number[];
    instructions?: string;
  }
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ isOpen, onClose, grade, initialData }) => {
  const { handleCreateAssignment, userProfiles } = useAuth();
  
  // Form State
  const [assignmentType, setAssignmentType] = useState<'chapters' | 'quiz'>('chapters');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [assignTo, setAssignTo] = useState<'all' | 'specific'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [quizQuestions, setQuizQuestions] = useState<QuestionPoolItem[]>([]);
  const [error, setError] = useState('');

  // Modal State
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  
  useEffect(() => {
    if (isOpen && initialData) {
        if (initialData.studentIds) {
            setAssignTo('specific');
            setSelectedStudentIds(new Set(initialData.studentIds));
        }
        if (initialData.instructions) {
            setInstructions(initialData.instructions);
            setTitle(`Remedial Work: ${initialData.instructions.substring(0, 20)}...`);
        }
    }
  }, [isOpen, initialData]);

  const studentsInGrade = useMemo(() => {
    return userProfiles.filter(p => p.grade === grade);
  }, [userProfiles, grade]);

  const chaptersBySubject = useMemo(() => {
    const subjects = curriculum[grade as keyof typeof curriculum] || {};
    return Object.entries(subjects).map(([subject, chapters]) => ({
      subject,
      chapters: chapters.map(chapter => ({
        id: `G${grade}-${subject}-${chapter}`,
        name: chapter,
      })),
    }));
  }, [grade]);

  if (!isOpen) return null;

  const handleToggleChapter = (chapterId: string) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) newSet.delete(chapterId);
      else newSet.add(chapterId);
      return newSet;
    });
  };
  
  const handleToggleStudent = (studentId: number) => {
    setSelectedStudentIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(studentId)) newSet.delete(studentId);
        else newSet.add(studentId);
        return newSet;
    });
  };

  const handleAddQuestions = (newQuestions: QuestionPoolItem[]) => {
    setQuizQuestions(prev => [...prev, ...newQuestions]);
    setIsAddQuestionModalOpen(false);
  };

  const handleRemoveQuestion = (qId: string) => {
    setQuizQuestions(prev => prev.filter(q => q.q_id !== qId));
  };

  const handleSave = () => {
    setError('');
    if (!title.trim() || !dueDate) {
      setError("Please add a title and due date.");
      return;
    }
    if (assignmentType === 'chapters' && selectedChapters.size === 0) {
      setError("Please select at least one chapter.");
      return;
    }
    if (assignmentType === 'quiz' && quizQuestions.length === 0) {
      setError("Please add at least one question to the quiz.");
      return;
    }
    if (assignTo === 'specific' && selectedStudentIds.size === 0) {
        setError("Please select at least one student to assign to.");
        return;
    }

    handleCreateAssignment({
      title,
      dueDate,
      instructions,
      assignedChapterIds: assignmentType === 'chapters' ? Array.from(selectedChapters) : [],
      classGrade: grade,
      assignedStudentIds: assignTo === 'specific' ? Array.from(selectedStudentIds) : [],
      assignmentType,
      quizQuestions: assignmentType === 'quiz' ? quizQuestions : [],
    });
    handleClose();
  };
  
  const handleClose = () => {
    setTitle('');
    setDueDate('');
    setInstructions('');
    setSelectedChapters(new Set());
    setSelectedStudentIds(new Set());
    setAssignTo('all');
    setAssignmentType('chapters');
    setQuizQuestions([]);
    setError('');
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ClipboardListIcon className="w-6 h-6" /> Create New Assignment for Class {grade}
            </h3>
            <button onClick={handleClose} className="p-1"><XIcon className="w-5 h-5" /></button>
          </div>
          
          <div className="flex-grow overflow-y-auto pr-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="title" className="form-label">Title</label>
                      <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="form-input w-full" />
                  </div>
                  <div>
                      <label htmlFor="due-date" className="form-label">Due Date</label>
                      <input type="date" id="due-date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="form-input w-full" min={new Date().toISOString().split("T")[0]} />
                  </div>
              </div>

              <div>
                  <label htmlFor="instructions" className="form-label">Instructions (Optional)</label>
                  <textarea id="instructions" value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} className="form-textarea w-full" placeholder="e.g., Complete the lesson and practice questions." />
              </div>

              <div>
                <h4 className="form-label mb-2">Assignment Type</h4>
                <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                    <button onClick={() => setAssignmentType('chapters')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${assignmentType === 'chapters' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}>Assign Chapters</button>
                    <button onClick={() => setAssignmentType('quiz')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${assignmentType === 'quiz' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}>Create Custom Quiz</button>
                </div>
              </div>
              
              {assignmentType === 'chapters' ? (
                <div>
                    <h4 className="form-label mb-2">Assign Chapters ({selectedChapters.size} selected)</h4>
                    <div className="max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-lg border space-y-2">
                    {chaptersBySubject.map(({ subject, chapters }) => (
                        <details key={subject} className="group">
                            <summary className="cursor-pointer list-none flex justify-between items-center font-semibold p-2 rounded-md hover:bg-slate-200">
                                {subject}
                                <ChevronDownIcon className="w-4 h-4 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="pl-4 pt-2 space-y-2">
                                {chapters.map(chapter => (
                                <label key={chapter.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                    <input type="checkbox" checked={selectedChapters.has(chapter.id)} onChange={() => handleToggleChapter(chapter.id)} className="h-4 w-4 rounded" />
                                    <span className="text-sm">{chapter.name}</span>
                                </label>
                                ))}
                            </div>
                        </details>
                    ))}
                    </div>
                </div>
              ) : (
                <div>
                    <h4 className="form-label mb-2">Quiz Questions ({quizQuestions.length})</h4>
                    <div className="max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-lg border space-y-2">
                        {quizQuestions.map((q, index) => (
                            <div key={q.q_id} className="p-2 bg-white rounded border flex justify-between items-start">
                                <p className="text-sm"><span className="font-bold">{index + 1}.</span> {q.question}</p>
                                <button onClick={() => handleRemoveQuestion(q.q_id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full flex-shrink-0 ml-2"><XIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                        <button onClick={() => setIsAddQuestionModalOpen(true)} className="w-full flex items-center justify-center gap-2 mt-2 p-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                            <PlusIcon className="w-5 h-5" /> Add Question
                        </button>
                    </div>
                </div>
              )}

              <div>
                  <h4 className="form-label mb-2">Assign To</h4>
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                      <button onClick={() => setAssignTo('all')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${assignTo === 'all' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}>Entire Class ({studentsInGrade.length})</button>
                      <button onClick={() => setAssignTo('specific')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${assignTo === 'specific' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}>Specific Students</button>
                  </div>
                  {assignTo === 'specific' && (
                      <div className="mt-2 p-3 bg-slate-50 border rounded-lg max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2">
                          {studentsInGrade.map(student => (
                              <label key={student.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                  <input type="checkbox" checked={selectedStudentIds.has(student.id)} onChange={() => handleToggleStudent(student.id)} className="h-4 w-4 rounded" />
                                  <span className="text-sm">{student.name}</span>
                              </label>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-2 flex-shrink-0">{error}</p>}
          <div className="mt-4 flex gap-4 flex-shrink-0">
            <button onClick={handleClose} className="btn w-full bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>
            <button onClick={handleSave} className="btn btn-primary w-full">Create Assignment</button>
          </div>
        </div>
      </div>
      {isAddQuestionModalOpen && (
        <Suspense>
            <AddQuestionModal
                isOpen={isAddQuestionModalOpen}
                onClose={() => setIsAddQuestionModalOpen(false)}
                grade={grade}
                onAddQuestions={handleAddQuestions}
            />
        </Suspense>
      )}
    </>
  );
};

export default CreateAssignmentModal;