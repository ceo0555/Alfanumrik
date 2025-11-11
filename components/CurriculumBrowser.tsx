import React, { useState, useMemo } from 'react';
import { CheckCircleIcon, CircleDotIcon, LockIcon, LayersIcon, ChevronDownIcon } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import { useStudentData } from '../contexts/StudentDataContext';
import { cbseSyllabus } from '../constants/syllabus';
import { SyllabusChapterTopic, SyllabusUnit } from '../types';

interface CurriculumBrowserProps {
  onSelectTopic: (chapter: SyllabusChapterTopic, topic: string) => void;
  onOpenFlashcardCreator: (grade: string, subject: string, chapter: string) => void;
}

const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({
  onSelectTopic,
  onOpenFlashcardCreator
}) => {
  const { activeProfile, updateActiveUserProfile } = useAuth();
  const { progressData } = useStudentData();
  
  if (!activeProfile || !progressData) return null;
  
  const { grade: selectedGrade, lastSubject: selectedSubjectFromProfile } = activeProfile;

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGrade = e.target.value;
    const newSubjects = Object.keys(cbseSyllabus[newGrade as keyof typeof cbseSyllabus]);
    const newSubject = newSubjects[0];
    updateActiveUserProfile({ grade: newGrade, lastSubject: newSubject });
  };

  const handleSubjectChange = (subject: string) => {
    updateActiveUserProfile({ lastSubject: subject });
  };
  
  const subjectsForGrade = useMemo(() => {
    return Object.keys(cbseSyllabus[selectedGrade as keyof typeof cbseSyllabus] || {});
  }, [selectedGrade]);

  const selectedSubject = useMemo(() => {
      if (subjectsForGrade.includes(selectedSubjectFromProfile)) {
          return selectedSubjectFromProfile;
      }
      return subjectsForGrade[0] || '';
  }, [subjectsForGrade, selectedSubjectFromProfile]);

  const unitsForSubject = useMemo(() => {
      return cbseSyllabus[selectedGrade as keyof typeof cbseSyllabus]?.[selectedSubject] || [];
  }, [selectedGrade, selectedSubject]);

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
              {Object.keys(cbseSyllabus).map(grade => (
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

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {unitsForSubject.map((unit: SyllabusUnit) => (
                <div key={unit.unit_no}>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">{unit.unit_name}</h2>
                    <div className="space-y-3">
                        {unit.chapters_or_topics.map((chapter: SyllabusChapterTopic) => {
                            const totalTopics = chapter.learning_outcomes.length;
                            const completedTopics = chapter.learning_outcomes.filter(topic => {
                                const topicId = `${chapter.topic_id}|${topic}`;
                                return progressData[topicId]?.status === 'completed';
                            }).length;
                            const chapterProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

                            return (
                                <details key={chapter.topic_id} className="bg-white rounded-xl border shadow-sm group overflow-hidden">
                                    <summary className="p-4 cursor-pointer list-none flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-slate-800">{chapter.topic_name}</h3>
                                            <p className="text-xs text-slate-500">{completedTopics} / {totalTopics} Topics Completed</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 bg-slate-200 rounded-full h-2 hidden sm:block">
                                                <div className="bg-indigo-500 h-2 rounded-full" style={{width: `${chapterProgress}%`}}></div>
                                            </div>
                                            <ChevronDownIcon className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                                        </div>
                                    </summary>
                                    <div className="border-t p-3 bg-slate-50/50 space-y-2">
                                        {chapter.learning_outcomes.map((topic, index) => {
                                            const topicId = `${chapter.topic_id}|${topic}`;
                                            const status = progressData[topicId]?.status;

                                            return (
                                                <button 
                                                    key={topicId} 
                                                    onClick={() => onSelectTopic(chapter, topic)}
                                                    className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-slate-100"
                                                >
                                                    {status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <div className="w-5 h-5 flex-shrink-0 text-center font-bold text-slate-400">{index + 1}</div>}
                                                    <span className={`text-sm ${status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{topic}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default CurriculumBrowser;