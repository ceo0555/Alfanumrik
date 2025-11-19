import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from '../../contexts/StudentDataContext';
import { Course, Assignment } from '../../types';
import { View } from '../../App';
import { BookOpenIcon, CheckCircleIcon, ClockIcon, UserIcon } from '../../constants/icons';
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
            <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            }>
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
        <div>
            {enrolledCourses.length > 0 ? (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">My Learning</h2>
                            <p className="text-slate-500 text-sm mt-1">Continue where you left off</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map(course => {
                            const teacher = userProfiles.find(p => p.id === course.teacherId);
                            const progress = getCourseProgress(course);
                            const isComplete = progress === 100;
                            const inProgress = progress > 0 && progress < 100;
                            
                            return (
                                <button 
                                    key={course.id} 
                                    onClick={() => setSelectedCourse(course)}
                                    className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 overflow-hidden text-left"
                                >
                                    {/* Course Header */}
                                    <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
                                        <div className="absolute top-2 right-2">
                                            {isComplete ? (
                                                <div className="bg-emerald-500 rounded-full p-1">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </div>
                                            ) : inProgress ? (
                                                <div className="bg-amber-500 rounded-full p-1">
                                                    <ClockIcon className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                                                    <span className="text-xs font-semibold">New</span>
                                                </div>
                                            )}
                                        </div>
                                        <BookOpenIcon className="w-10 h-10 mb-3 opacity-80" />
                                        <h3 className="font-bold text-xl leading-tight">{course.title}</h3>
                                        <p className="text-xs text-indigo-100 mt-1">Class {course.grade}</p>
                                    </div>

                                    {/* Course Body */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                                            <UserIcon className="w-4 h-4" />
                                            <span>{teacher?.name || 'Unknown Instructor'}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600 font-medium">Course Progress</span>
                                                <span className="font-bold text-indigo-600">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-500 ${
                                                        isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                                    }`}
                                                    style={{width: `${progress}%`}}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>{course.content.length} lessons</span>
                                                <span>{course.content.filter(i => i.type === 'quiz').length} assessments</span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="text-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                                                {isComplete ? 'Review Course' : inProgress ? 'Continue Learning' : 'Start Course'} →
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </>
            ) : (
                <ExplorationHub />
            )}
        </div>
    );
};

export default StudentLmsView;