import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from '../../contexts/StudentDataContext';
import { Course, Assignment } from '../../types';
import { View } from '../../App';
import ExplorationHub from './ExplorationHub';
import { BookIcon, ClockIcon, CheckCircleIcon, TrendingUpIcon, AwardIcon } from '../../constants/icons';

const CourseView = React.lazy(() => import('./CourseView'));
const LmsAnalyticsDashboard = React.lazy(() => import('./LmsAnalyticsDashboard'));

interface StudentLmsViewProps {
    setView: (view: View) => void;
    setActiveQuiz: (assignment: Assignment) => void;
}

const StudentLmsView: React.FC<StudentLmsViewProps> = ({ setView, setActiveQuiz }) => {
    const { activeProfile, allCourses, userProfiles, allSubmissions, allGrades } = useAuth();
    const { progressData } = useStudentData();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<'courses' | 'analytics'>('courses');

    const enrolledCourses = useMemo(() => {
        if (!activeProfile) return [];
        return allCourses.filter(c => c.enrolledStudentIds.includes(activeProfile.id));
    }, [allCourses, activeProfile]);

    const getCourseProgress = (course: Course) => {
        if (!activeProfile || course.content.length === 0) return 0;

        const completedItems = course.content.filter(item => {
            if (item.type === 'lesson') {
                return progressData[item.contentId]?.status === 'completed';
            }
            if (item.type === 'quiz') {
                return allSubmissions.some(s => s.assignmentId === item.contentId && s.studentId === activeProfile.id);
            }
            return false;
        }).length;
        
        return Math.round((completedItems / course.content.length) * 100);
    };

    // Calculate overall stats
    const stats = useMemo(() => {
        const totalCourses = enrolledCourses.length;
        const avgProgress = enrolledCourses.length > 0
            ? enrolledCourses.reduce((sum, c) => sum + getCourseProgress(c), 0) / enrolledCourses.length
            : 0;
        const myGrades = allGrades.filter(g => g.studentId === activeProfile?.id);
        const avgGrade = myGrades.length > 0
            ? myGrades.reduce((sum, g) => sum + (g.score / g.totalMarks) * 100, 0) / myGrades.length
            : 0;
        
        return {
            totalCourses,
            avgProgress: Math.round(avgProgress),
            avgGrade: Math.round(avgGrade),
            totalAssignments: myGrades.length
        };
    }, [enrolledCourses, activeProfile, allGrades]);

    if (!activeProfile) return null;
    
    if (selectedCourse) {
        return (
            <Suspense fallback={<div>Loading course...</div>}>
                <CourseView 
                    course={selectedCourse} 
                    onBack={() => setSelectedCourse(null)} 
                    setView={setView}
                    setActiveQuiz={setActiveQuiz}
                />
            </Suspense>
        )
    }

    return (
        <div className="animate-slide-in-up">
            {enrolledCourses.length > 0 ? (
                <>
                    {/* Header with Stats */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">My Learning Hub</h1>
                        <p className="text-slate-500 text-lg">Continue your journey to excellence</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl text-white shadow-lg">
                            <BookIcon className="w-6 h-6 mb-2 opacity-90" />
                            <p className="text-2xl font-bold">{stats.totalCourses}</p>
                            <p className="text-sm opacity-90">Active Courses</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <TrendingUpIcon className="w-6 h-6 text-emerald-600 mb-2" />
                            <p className="text-2xl font-bold text-slate-800">{stats.avgProgress}%</p>
                            <p className="text-sm text-slate-500">Avg Progress</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <AwardIcon className="w-6 h-6 text-amber-600 mb-2" />
                            <p className="text-2xl font-bold text-slate-800">{stats.avgGrade}%</p>
                            <p className="text-sm text-slate-500">Avg Grade</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            <CheckCircleIcon className="w-6 h-6 text-indigo-600 mb-2" />
                            <p className="text-2xl font-bold text-slate-800">{stats.totalAssignments}</p>
                            <p className="text-sm text-slate-500">Completed</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b mb-6">
                        <div className="flex gap-6">
                            <button 
                                onClick={() => setActiveTab('courses')}
                                className={`pb-3 px-1 font-semibold border-b-2 transition-colors ${
                                    activeTab === 'courses' 
                                        ? 'border-indigo-600 text-indigo-600' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                My Courses
                            </button>
                            <button 
                                onClick={() => setActiveTab('analytics')}
                                className={`pb-3 px-1 font-semibold border-b-2 transition-colors ${
                                    activeTab === 'analytics' 
                                        ? 'border-indigo-600 text-indigo-600' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Analytics
                            </button>
                        </div>
                    </div>

                    {activeTab === 'courses' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledCourses.map(course => {
                                const teacher = userProfiles.find(p => p.id === course.teacherId);
                                const progress = getCourseProgress(course);
                                const isCompleted = progress === 100;
                                
                                return (
                                    <button 
                                        key={course.id} 
                                        onClick={() => setSelectedCourse(course)}
                                        className="bg-white p-6 rounded-xl shadow-sm border hover:border-indigo-400 hover:shadow-lg transition-all transform hover:-translate-y-1 text-left flex flex-col group relative overflow-hidden"
                                    >
                                        {/* Completed Badge */}
                                        {isCompleted && (
                                            <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                                                <CheckCircleIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                        
                                        {/* Course Icon */}
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <BookIcon className="w-6 h-6 text-indigo-600" />
                                        </div>

                                        <h3 className="font-bold text-xl text-slate-800 mb-2">{course.title}</h3>
                                        <p className="text-sm text-slate-500 mb-1 flex-grow line-clamp-2">{course.description}</p>
                                        <p className="text-xs text-slate-400 mb-4">Taught by {teacher?.name || 'Unknown'}</p>
                                        
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-600">Your Progress</span>
                                                <span className="font-bold text-indigo-600">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                                    style={{width: `${progress}%`}}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                                                <ClockIcon className="w-4 h-4" />
                                                <span>{course.content.length} items</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <Suspense fallback={<div className="text-center p-8">Loading analytics...</div>}>
                            <LmsAnalyticsDashboard courses={allCourses} isTeacherView={false} />
                        </Suspense>
                    )}
                </>
            ) : (
                <ExplorationHub />
            )}
        </div>
    );
};

export default StudentLmsView;