import React, { useState, useMemo } from 'react';
import { Course, Assignment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from '../../contexts/StudentDataContext';
import { View } from '../../App';
import { ArrowLeftIcon, BookIcon, ClipboardListIcon, CheckCircleIcon } from '../../constants/icons';
import MyGrades from './MyGrades';

interface CourseViewProps {
    course: Course;
    onBack: () => void;
    setView: (view: View) => void;
    setActiveQuiz: (assignment: Assignment) => void;
}

const CourseView: React.FC<CourseViewProps> = ({ course, onBack, setView, setActiveQuiz }) => {
    const { updateActiveUserProfile, allAssignments, allSubmissions, activeProfile } = useAuth();
    const { progressData } = useStudentData();
    const [activeTab, setActiveTab] = useState<'content' | 'grades'>('content');

    const courseProgress = useMemo(() => {
        if (!activeProfile || course.content.length === 0) return 0;
        const completedItems = course.content.filter(item => {
            if (item.type === 'lesson') return progressData[item.contentId]?.status === 'completed';
            if (item.type === 'quiz') return allSubmissions.some(s => s.assignmentId === item.contentId && s.studentId === activeProfile.id);
            return false;
        }).length;
        return Math.round((completedItems / course.content.length) * 100);
    }, [course, activeProfile, progressData, allSubmissions]);

    const handleLessonClick = (chapterId: string) => {
        const [, grade, subject, ...chapterParts] = chapterId.split('-');
        const chapter = chapterParts.join('-');
        updateActiveUserProfile({ lastChapter: chapter, lastSubject: subject, grade });
        setView('lesson');
    };

    const handleQuizClick = (assignmentId: string) => {
        const assignment = allAssignments.find(a => a.id === assignmentId);
        if (assignment) {
            setActiveQuiz(assignment);
            setView('quiz');
        }
    };
    
    if (!activeProfile) return null;

    const renderContent = () => {
        return course.content.map(item => {
            const isCompleted = item.type === 'lesson'
                ? progressData[item.contentId]?.status === 'completed'
                : !!allSubmissions.find(s => s.assignmentId === item.contentId && s.studentId === activeProfile.id);

            return (
                <button 
                    key={item.contentId} 
                    onClick={() => item.type === 'lesson' ? handleLessonClick(item.contentId) : handleQuizClick(item.contentId)}
                    className="w-full flex items-center gap-4 p-3 text-left bg-white rounded-lg hover:bg-slate-50 transition-colors border"
                >
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500">
                        {item.type === 'lesson' ? <BookIcon className="w-5 h-5"/> : <ClipboardListIcon className="w-5 h-5"/>}
                    </div>
                    <span className="flex-1 font-semibold text-slate-700">{item.title}</span>
                    {isCompleted && <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                </button>
            )
        })
    };

    return (
        <div className="animate-slide-in-up">
            <button onClick={onBack} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 mb-6 flex items-center gap-2 px-4 py-2 rounded-lg font-medium">
                <ArrowLeftIcon className="w-4 h-4"/> Back to My Courses
            </button>

            {/* Course Header Card */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-2xl p-8 mb-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-4xl font-extrabold mb-3">{course.title}</h1>
                        <p className="text-indigo-100 text-lg mb-4 leading-relaxed">{course.description || 'Start learning and track your progress'}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                <BookIcon className="w-4 h-4" />
                                <span className="font-medium">{course.content.length} Learning Items</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-medium">Grade {course.grade}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Circle */}
                    <div className="flex-shrink-0">
                        <div className="relative w-32 h-32">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                <circle 
                                    cx="64" 
                                    cy="64" 
                                    r="56" 
                                    stroke="white" 
                                    strokeWidth="8" 
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 56}`}
                                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - courseProgress / 100)}`}
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-3xl font-extrabold">{courseProgress}%</span>
                                <span className="text-xs text-indigo-100 font-medium">Complete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-8">
                    <button 
                        onClick={() => setActiveTab('content')} 
                        className={`pb-4 font-bold text-base border-b-2 transition-colors ${
                            activeTab === 'content' 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Course Content
                    </button>
                    <button 
                        onClick={() => setActiveTab('grades')} 
                        className={`pb-4 font-bold text-base border-b-2 transition-colors ${
                            activeTab === 'grades' 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        My Grades
                    </button>
                </div>
            </div>

            {activeTab === 'content' ? (
                <div className="space-y-3">
                    {renderContent()}
                </div>
            ) : (
                <MyGrades course={course} />
            )}
        </div>
    );
};

export default CourseView;