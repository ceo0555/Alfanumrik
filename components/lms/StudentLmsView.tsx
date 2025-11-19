import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from '../../contexts/StudentDataContext';
import { Course, Assignment } from '../../types';
import { View } from '../../App';
import ExplorationHub from './ExplorationHub';

const CourseView = React.lazy(() => import('./CourseView'));

interface StudentLmsViewProps {
    setView: (view: View) => void;
    setActiveQuiz: (assignment: Assignment) => void;
}

const StudentLmsView: React.FC<StudentLmsViewProps> = ({ setView, setActiveQuiz }) => {
    const { activeProfile, allCourses, userProfiles, allSubmissions } = useAuth();
    const { progressData } = useStudentData();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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

    // Color palette for course cards
    const courseColors = [
        { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-600', lightBg: 'bg-blue-50' },
        { bg: 'from-purple-500 to-pink-600', text: 'text-purple-600', lightBg: 'bg-purple-50' },
        { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', lightBg: 'bg-emerald-50' },
        { bg: 'from-orange-500 to-red-600', text: 'text-orange-600', lightBg: 'bg-orange-50' },
        { bg: 'from-cyan-500 to-blue-600', text: 'text-cyan-600', lightBg: 'bg-cyan-50' },
        { bg: 'from-fuchsia-500 to-purple-600', text: 'text-fuchsia-600', lightBg: 'bg-fuchsia-50' },
    ];

    return (
        <div className="animate-slide-in-up">
            {enrolledCourses.length > 0 ? (
                <>
                    <div className="mb-8">
                        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Your Learning Journey</h1>
                        <p className="text-lg text-slate-600">Continue where you left off and achieve your goals</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map((course, index) => {
                            const teacher = userProfiles.find(p => p.id === course.teacherId);
                            const progress = getCourseProgress(course);
                            const colorScheme = courseColors[index % courseColors.length];
                            
                            return (
                                <button 
                                    key={course.id} 
                                    onClick={() => setSelectedCourse(course)}
                                    className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300 text-left overflow-hidden transform hover:-translate-y-1"
                                >
                                    {/* Gradient Header */}
                                    <div className={`h-32 bg-gradient-to-br ${colorScheme.bg} relative overflow-hidden`}>
                                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
                                                <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">{course.grade}</span>
                                                <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">{course.content.length} lessons</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-xl text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description || 'Explore this course to learn more'}</p>
                                        
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                                {teacher?.name?.charAt(0) || 'T'}
                                            </div>
                                            <span className="font-medium">{teacher?.name || 'Instructor'}</span>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="font-semibold text-slate-700">Your Progress</span>
                                                <span className="font-bold text-indigo-600">{progress}% Complete</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div 
                                                    className={`h-2.5 rounded-full bg-gradient-to-r ${colorScheme.bg} transition-all duration-500`}
                                                    style={{width: `${progress}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                    
                    {/* AI Learning Insights */}
                    <div className="mt-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-800 mb-2">AI Learning Insights</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    You're making great progress! Based on your learning patterns, we recommend focusing on practice exercises in your most recent courses. Keep up the momentum!
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <ExplorationHub />
            )}
        </div>
    );
};

export default StudentLmsView;