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

    return (
        <div className="space-y-6">
            {enrolledCourses.length > 0 ? (
                <>
                    {/* Hero Section */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                        <h1 className="text-4xl font-extrabold mb-2">My Learning Journey</h1>
                        <p className="text-indigo-100">Continue where you left off and achieve your goals!</p>
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-3xl font-bold">{enrolledCourses.length}</p>
                                <p className="text-indigo-100 text-sm">Active Courses</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-3xl font-bold">
                                    {Math.round(enrolledCourses.reduce((sum, c) => sum + getCourseProgress(c), 0) / enrolledCourses.length)}%
                                </p>
                                <p className="text-indigo-100 text-sm">Avg Progress</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 col-span-2 sm:col-span-1">
                                <p className="text-3xl font-bold">
                                    {enrolledCourses.filter(c => getCourseProgress(c) === 100).length}
                                </p>
                                <p className="text-indigo-100 text-sm">Completed</p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800">Your Courses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map(course => {
                            const teacher = userProfiles.find(p => p.id === course.teacherId);
                            const progress = getCourseProgress(course);
                            const isCompleted = progress === 100;
                            
                            return (
                                <button 
                                    key={course.id} 
                                    onClick={() => setSelectedCourse(course)}
                                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-slate-200 text-left overflow-hidden group"
                                >
                                    {/* Course Header */}
                                    <div className={`p-4 ${isCompleted ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                                        <h3 className="font-bold text-xl text-white mb-1">{course.title}</h3>
                                        <p className="text-white/80 text-sm">by {teacher?.name || 'Unknown'}</p>
                                    </div>

                                    {/* Course Body */}
                                    <div className="p-5">
                                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                                        
                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="font-semibold text-slate-700">
                                                    {isCompleted ? 'Completed!' : 'Your Progress'}
                                                </span>
                                                <span className="text-slate-600 font-medium">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                    style={{width: `${progress}%`}}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm text-slate-600">
                                            <span>{course.content.length} items</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                isCompleted ? 'bg-green-100 text-green-700' :
                                                progress > 0 ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {isCompleted ? 'Completed' : progress > 0 ? 'In Progress' : 'Start Learning'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
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