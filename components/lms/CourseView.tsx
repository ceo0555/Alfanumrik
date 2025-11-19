import React, { useState, useMemo } from 'react';
import { Course, Assignment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from '../../contexts/StudentDataContext';
import { View } from '../../App';
import { ArrowLeftIcon, BookIcon, ClipboardListIcon, CheckCircleIcon, MessageCircleIcon, AwardIcon } from '../../constants/icons';
import MyGrades from './MyGrades';

interface CourseViewProps {
    course: Course;
    onBack: () => void;
    setView: (view: View) => void;
    setActiveQuiz: (assignment: Assignment) => void;
}

const CourseView: React.FC<CourseViewProps> = ({ course, onBack, setView, setActiveQuiz }) => {
    const { updateActiveUserProfile, allAssignments, allSubmissions, activeProfile, userProfiles } = useAuth();
    const { progressData } = useStudentData();
    const [activeTab, setActiveTab] = useState<'content' | 'grades' | 'discussion'>('content');

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

    const teacher = userProfiles.find(p => p.id === course.teacherId);
    const isCompleted = courseProgress === 100;

    const renderContent = () => {
        return course.content.map((item, index) => {
            const isItemCompleted = item.type === 'lesson'
                ? progressData[item.contentId]?.status === 'completed'
                : !!allSubmissions.find(s => s.assignmentId === item.contentId && s.studentId === activeProfile.id);

            return (
                <button 
                    key={item.contentId} 
                    onClick={() => item.type === 'lesson' ? handleLessonClick(item.contentId) : handleQuizClick(item.contentId)}
                    className="w-full flex items-center gap-4 p-4 text-left bg-white rounded-xl hover:bg-slate-50 hover:shadow-md transition-all border group"
                >
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                        {item.type === 'lesson' ? <BookIcon className="w-5 h-5"/> : <ClipboardListIcon className="w-5 h-5"/>}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                            <span className="font-bold text-slate-800">{item.title}</span>
                        </div>
                        <span className="text-xs text-slate-500 capitalize">{item.type}</span>
                    </div>
                    {isItemCompleted && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-semibold text-emerald-600">Completed</span>
                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                        </div>
                    )}
                </button>
            )
        })
    };

    return (
        <div className="animate-slide-in-up">
            <button onClick={onBack} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 mb-6 flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4"/> Back to My Courses
            </button>

            {/* Course Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 text-white mb-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
                
                <div className="relative z-10">
                    {isCompleted && (
                        <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                            <AwardIcon className="w-4 h-4" />
                            Course Completed!
                        </div>
                    )}
                    <h1 className="text-4xl font-extrabold mb-2">{course.title}</h1>
                    <p className="text-indigo-100 text-lg mb-4">{course.description}</p>
                    <p className="text-sm opacity-90">Taught by <span className="font-semibold">{teacher?.name || 'Unknown'}</span></p>
                    
                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold">Your Progress</span>
                            <span className="font-bold">{courseProgress}%</span>
                        </div>
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-white h-3 rounded-full transition-all duration-500 shadow-lg"
                                style={{ width: `${courseProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b mb-6">
                <div className="flex gap-6">
                    <button 
                        onClick={() => setActiveTab('content')} 
                        className={`pb-3 px-1 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'content' 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <BookIcon className="w-4 h-4" />
                        Course Content
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{course.content.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('grades')} 
                        className={`pb-3 px-1 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'grades' 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <AwardIcon className="w-4 h-4" />
                        My Grades
                    </button>
                    <button 
                        onClick={() => setActiveTab('discussion')} 
                        className={`pb-3 px-1 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'discussion' 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <MessageCircleIcon className="w-4 h-4" />
                        Discussion
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'content' ? (
                <div>
                    {course.content.length > 0 ? (
                        <div className="space-y-3">
                            {renderContent()}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-50 rounded-xl">
                            <BookIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-lg font-semibold text-slate-600">No content available yet</p>
                            <p className="text-sm text-slate-500 mt-1">Check back later for course materials</p>
                        </div>
                    )}
                </div>
            ) : activeTab === 'grades' ? (
                <MyGrades course={course} />
            ) : (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                    <MessageCircleIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-semibold text-slate-600">Discussion Forum Coming Soon</p>
                    <p className="text-sm text-slate-500 mt-1">Connect with your classmates and instructor</p>
                </div>
            )}
        </div>
    );
};

export default CourseView;