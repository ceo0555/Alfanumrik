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
        <div>
            <button onClick={onBack} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 mb-4 flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4"/> Back to My Courses
            </button>

            <h1 className="text-3xl font-extrabold text-slate-800">{course.title}</h1>
            <p className="text-slate-500 mt-1">{course.description}</p>
            
            <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-600">Your Progress</span>
                    <span className="font-bold text-indigo-600">{courseProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{ width: `${courseProgress}%` }}></div>
                </div>
            </div>
            
            <div className="border-b mt-6 mb-4">
                <div className="flex gap-4">
                    <button onClick={() => setActiveTab('content')} className={`py-2 font-semibold border-b-2 ${activeTab === 'content' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>Course Content</button>
                    <button onClick={() => setActiveTab('grades')} className={`py-2 font-semibold border-b-2 ${activeTab === 'grades' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>My Grades</button>
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