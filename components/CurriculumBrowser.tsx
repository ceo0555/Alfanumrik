import React, { useState, useMemo } from 'react';
import { curriculum } from '../constants/curriculum';
import { CheckCircleIcon, CircleDotIcon, LockIcon, LayersIcon, CalendarPlusIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import { useStudentData } from '../contexts/StudentDataContext';

interface CurriculumBrowserProps {
  onSelectChapter: (chapter: string, subject: string, grade: string) => void;
  onOpenFlashcardCreator: (grade: string, subject: string, chapter: string) => void;
}

const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({
  onSelectChapter,
  onOpenFlashcardCreator
}) => {
  const { activeProfile, updateActiveUserProfile, allAssignments } = useAuth();
  const { progressData, userFlashcards, handleSetDueDate } = useStudentData();
  
  const [editingDueDateFor, setEditingDueDateFor] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState('');


  if (!activeProfile || !progressData || !userFlashcards) return null;
  
  const { grade: selectedGrade, lastSubject: selectedSubject } = activeProfile;

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGrade = e.target.value;
    const newSubjects = Object.keys(curriculum[newGrade as keyof typeof curriculum]);
    const newSubject = newSubjects[0];
    updateActiveUserProfile({ grade: newGrade, lastSubject: newSubject });
  };

  const handleSubjectChange = (subject: string) => {
    updateActiveUserProfile({ lastSubject: subject });
  };
  
  const subjectsForGrade = useMemo(() => Object.keys(curriculum[selectedGrade as keyof typeof curriculum]), [selectedGrade]);
  const chaptersForSubject = useMemo(() => curriculum[selectedGrade as keyof typeof curriculum][selectedSubject], [selectedGrade, selectedSubject]);

  const findLastCompletedIndex = (chapters: string[], subject: string) => {
    let lastCompleted = -1;
    for (let i = 0; i < chapters.length; i++) {
        const chapterId = `G${selectedGrade}-${subject}-${chapters[i]}`;
        if (progressData[chapterId]?.status === 'completed') {
            lastCompleted = i;
        } else {
            break; 
        }
    }
    return lastCompleted;
  };
  
  const lastCompletedIndex = findLastCompletedIndex(chaptersForSubject, selectedSubject);
  
  const handleScheduleClick = (chapterId: string, currentDueDate?: string) => {
    if (editingDueDateFor === chapterId) {
      setEditingDueDateFor(null);
    } else {
      setTempDate(currentDueDate || '');
      setEditingDueDateFor(chapterId);
    }
  };

  const handleSaveDate = (chapterId: string) => {
    handleSetDueDate(chapterId, tempDate);
    setEditingDueDateFor(null);
  };
  
  const handleClearDate = (chapterId: string) => {
    handleSetDueDate(chapterId, null);
    setEditingDueDateFor(null);
  };
  
  const studentAssignments = useMemo(() => {
    if (!activeProfile) return [];
    const today = new Date().toISOString().split('T')[0];
    return allAssignments.filter(assignment => {
        if (assignment.classGrade !== activeProfile.grade) return false;
        if (assignment.dueDate < today) return false;

        const isForAll = !assignment.assignedStudentIds || assignment.assignedStudentIds.length === 0;
        const isForStudent = assignment.assignedStudentIds?.includes(activeProfile.id);
        return isForAll || isForStudent;
    });
  }, [allAssignments, activeProfile]);


  return (
    <div className="flex flex-col h-full animate-slide-in-up">
        <div className="px-1 mb-4 max-w-xs">
            <label htmlFor="grade-select" className="text-sm font-medium text-slate-600">Grade</label>
            <select
              id="grade-select"
              value={selectedGrade}
              onChange={handleGradeChange}
              className="form-select mt-1 block w-full pl-3 pr-10 py-2 text-base"
            >
              {Object.keys(curriculum).map(grade => (
                  <option key={grade} value={grade}>Class {grade}</option>
              ))}
            </select>
        </div>
        
        <div className="mb-4 border-b border-slate-200">
             <div className="flex items-center -mb-px flex-nowrap md:flex-wrap overflow-x-auto">
                {subjectsForGrade.map(subject => (
                    <button
                        key={subject}
                        onClick={() => handleSubjectChange(subject)}
                        className={`flex-shrink-0 px-3 py-3 font-semibold text-sm border-b-2 transition-colors ${
                            selectedSubject === subject
                                ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                    >
                        {subject}
                    </button>
                ))}
             </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
            <div className="relative pl-4">
                {/* Timeline bar */}
                <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-slate-200 rounded-full md:ml-0 -ml-2"></div>

                {chaptersForSubject.map((chapter, index) => {
                    const chapterId = `G${selectedGrade}-${selectedSubject}-${chapter}`;
                    const progress = progressData[chapterId];
                    const status = progress?.status;
                    const personalDueDate = progress?.dueDate;
                    
                    const assignmentForChapter = studentAssignments.find(a => a.assignedChapterIds.includes(chapterId));

                    const isLocked = index > lastCompletedIndex + 1;
                    const isCurrent = index === lastCompletedIndex + 1;
                    const hasFlashcards = (userFlashcards?.[chapterId]?.length || 0) > 0;

                    const NodeIcon = () => {
                        if (isLocked) return <LockIcon className="w-4 h-4 text-slate-400" />;
                        if (status === 'completed') return <CheckCircleIcon className="w-6 h-6 text-emerald-500" />;
                        if (isCurrent) return <CircleDotIcon className="w-6 h-6 text-[var(--brand-primary)]" />;
                        return <div className="w-3 h-3 bg-slate-300 rounded-full border-2 border-white"></div>;
                    };

                    return (
                        <div key={chapter} className="relative flex items-start mb-4">
                            <div className="absolute left-0 top-3 -translate-x-1/2 z-10 bg-white p-1 rounded-full flex items-center justify-center h-8 w-8">
                                <NodeIcon />
                            </div>
                            <div className="ml-8 sm:ml-10 w-full group">
                                <button
                                    onClick={() => onSelectChapter(chapter, selectedSubject, selectedGrade)}
                                    disabled={isLocked}
                                    className={`relative w-full text-left p-3 pr-14 rounded-lg border transition-all duration-200 ${
                                        isCurrent ? 'bg-white shadow-md border-indigo-200' : 'bg-white shadow-sm border-[var(--border-color)]'
                                    } ${isLocked ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'hover:shadow-md hover:border-slate-300'}`}
                                >
                                    <p className={`font-bold text-sm ${isCurrent ? 'text-[var(--brand-primary)]' : 'text-slate-700'}`}>{chapter}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                        <span>{status === 'completed' ? 'Completed' : isCurrent ? 'Next up' : isLocked ? 'Locked' : 'Not started'}</span>
                                        {assignmentForChapter && !isLocked && (
                                            <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                                                Due: {new Date(assignmentForChapter.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </p>
                                </button>
                                
                                <div className="absolute top-1 right-2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  {!isLocked && (
                                      <>
                                          <button
                                              onClick={() => onOpenFlashcardCreator(selectedGrade, selectedSubject, chapter)}
                                              className={`p-2 rounded-full ${hasFlashcards ? 'text-[var(--brand-primary)] bg-[var(--brand-secondary)] hover:bg-indigo-200' : 'text-slate-400 hover:bg-slate-100'}`}
                                              title={hasFlashcards ? "View/Edit Flashcards" : "Create Flashcards"}
                                          >
                                              <LayersIcon className="w-4 h-4" />
                                          </button>
                                          
                                          <button 
                                              className={`p-2 rounded-full transition-colors ${editingDueDateFor === chapterId ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-100'}`}
                                              title={personalDueDate ? "Change personal due date" : "Set personal due date"}
                                              onClick={() => handleScheduleClick(chapterId, personalDueDate)}
                                          >
                                              <CalendarPlusIcon className="w-4 h-4"/>
                                          </button>
                                      </>
                                  )}
                                </div>

                                {editingDueDateFor === chapterId && (
                                      <div className="mt-2 p-3 bg-slate-100 rounded-lg animate-scale-in">
                                          <label className="block text-sm font-medium text-slate-700 mb-1">Set a personal due date:</label>
                                          <div className="flex flex-col sm:flex-row gap-2">
                                              <input
                                                  type="date"
                                                  value={tempDate}
                                                  onChange={(e) => setTempDate(e.target.value)}
                                                  className="form-input w-full"
                                                  min={new Date().toISOString().split("T")[0]}
                                              />
                                              <button onClick={() => handleSaveDate(chapterId)} disabled={!tempDate} className="btn btn-primary px-3 py-1 text-sm">Save</button>
                                              {personalDueDate && <button onClick={() => handleClearDate(chapterId)} className="btn bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1 text-sm">Clear</button>}
                                          </div>
                                      </div>
                                  )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default CurriculumBrowser;