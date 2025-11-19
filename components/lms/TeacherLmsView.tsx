import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Course } from '../../types';
import { PlusIcon, BookIcon } from '../../constants/icons';

const CreateCourseModal = React.lazy(() => import('./CreateCourseModal'));
const CourseEditor = React.lazy(() => import('./CourseEditor'));

const TeacherLmsView: React.FC = () => {
    const { activeProfile, allCourses, handleUpdateCourses } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const teacherCourses = useMemo(() => {
        if (!activeProfile) return [];
        return allCourses.filter(c => c.teacherId === activeProfile.id);
    }, [allCourses, activeProfile]);

    const handleCreateCourse = (title: string, description: string) => {
        if (!activeProfile) return;
        const newCourse: Course = {
            id: `course-${Date.now()}`,
            title,
            description,
            teacherId: activeProfile.id,
            grade: activeProfile.grade || '10', // Default grade
            content: [],
            enrolledStudentIds: [],
        };
        handleUpdateCourses([...allCourses, newCourse]);
        setIsCreateModalOpen(false);
    };

    if (selectedCourse) {
        return (
            <Suspense fallback={<div>Loading editor...</div>}>
                <CourseEditor course={selectedCourse} onBack={() => setSelectedCourse(null)} />
            </Suspense>
        );
    }

    const courseColors = [
        { bg: 'from-blue-500 to-indigo-600', accent: 'bg-blue-500' },
        { bg: 'from-purple-500 to-pink-600', accent: 'bg-purple-500' },
        { bg: 'from-emerald-500 to-teal-600', accent: 'bg-emerald-500' },
        { bg: 'from-orange-500 to-red-600', accent: 'bg-orange-500' },
        { bg: 'from-cyan-500 to-blue-600', accent: 'bg-cyan-500' },
    ];

    const totalStudents = useMemo(() => {
        return teacherCourses.reduce((sum, course) => sum + course.enrolledStudentIds.length, 0);
    }, [teacherCourses]);

    const totalContent = useMemo(() => {
        return teacherCourses.reduce((sum, course) => sum + course.content.length, 0);
    }, [teacherCourses]);

    return (
        <div className="animate-slide-in-up">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Course Management</h1>
                    <p className="text-lg text-slate-600">Create, organize, and track your courses</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl">
                    <PlusIcon className="w-5 h-5" /> Create New Course
                </button>
            </div>

            {teacherCourses.length > 0 ? (
                <>
                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-blue-100 text-sm font-medium">Total Courses</span>
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <BookIcon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-4xl font-extrabold">{teacherCourses.length}</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-purple-100 text-sm font-medium">Total Students</span>
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-4xl font-extrabold">{totalStudents}</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-emerald-100 text-sm font-medium">Learning Items</span>
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-4xl font-extrabold">{totalContent}</p>
                        </div>
                    </div>

                    {/* Course Cards */}
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Your Courses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teacherCourses.map((course, index) => {
                            const colorScheme = courseColors[index % courseColors.length];
                            return (
                                <div key={course.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden">
                                    {/* Gradient Header */}
                                    <div className={`h-24 bg-gradient-to-br ${colorScheme.bg} relative`}>
                                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                                                Grade {course.grade}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5">
                                        <h3 className="font-bold text-xl text-slate-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
                                            {course.description || 'No description provided'}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                                <span className="font-medium">{course.content.length} items</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                <span className="font-medium">{course.enrolledStudentIds.length} students</span>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setSelectedCourse(course)} 
                                            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-700"
                                        >
                                            Manage Course
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                 <div className="text-center py-20 text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                    <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BookIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">No Courses Yet</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        Start building your learning platform by creating your first course. Add lessons, quizzes, and track student progress.
                    </p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary px-8 py-3 text-base font-semibold shadow-lg">
                        Create Your First Course
                    </button>
                </div>
            )}

            {isCreateModalOpen && (
                <Suspense fallback={<div/>}>
                    <CreateCourseModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onCreate={handleCreateCourse}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default TeacherLmsView;
