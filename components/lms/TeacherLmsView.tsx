import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Course } from '../../types';
import { PlusIcon, BookIcon, UserGroupIcon, ChartBarIcon, PlayIcon } from '../../constants/icons';

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

    const totalStudents = useMemo(() => {
        return teacherCourses.reduce((sum, c) => sum + c.enrolledStudentIds.length, 0);
    }, [teacherCourses]);

    const totalContent = useMemo(() => {
        return teacherCourses.reduce((sum, c) => sum + c.content.length, 0);
    }, [teacherCourses]);

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2">Teacher Dashboard</h1>
                        <p className="text-indigo-100">Welcome back, {activeProfile?.name}!</p>
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="btn bg-white text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                        <PlusIcon className="w-5 h-5" /> Create New Course
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <BookIcon className="w-8 h-8 text-white/80" />
                            <div>
                                <p className="text-3xl font-bold">{teacherCourses.length}</p>
                                <p className="text-indigo-100 text-sm">Active Courses</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <UserGroupIcon className="w-8 h-8 text-white/80" />
                            <div>
                                <p className="text-3xl font-bold">{totalStudents}</p>
                                <p className="text-indigo-100 text-sm">Total Students</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <ChartBarIcon className="w-8 h-8 text-white/80" />
                            <div>
                                <p className="text-3xl font-bold">{totalContent}</p>
                                <p className="text-indigo-100 text-sm">Content Items</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {teacherCourses.length > 0 ? (
                <>
                    <h2 className="text-2xl font-bold text-slate-800">Your Courses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teacherCourses.map(course => (
                            <div 
                                key={course.id} 
                                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-slate-200 overflow-hidden group"
                            >
                                {/* Course Header */}
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-xl text-white mb-1">{course.title}</h3>
                                            <p className="text-indigo-100 text-sm">Class {course.grade}</p>
                                        </div>
                                        <PlayIcon className="w-6 h-6 text-white/70" />
                                    </div>
                                </div>

                                {/* Course Body */}
                                <div className="p-5">
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                                    
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-blue-50 rounded-lg p-3">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">Content</p>
                                            <p className="text-2xl font-bold text-blue-700">{course.content.length}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3">
                                            <p className="text-xs text-green-600 font-semibold mb-1">Students</p>
                                            <p className="text-2xl font-bold text-green-700">{course.enrolledStudentIds.length}</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedCourse(course)} 
                                        className="btn btn-primary w-full group-hover:bg-indigo-700 transition-colors"
                                    >
                                        Manage Course
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                 <div className="text-center py-20 text-slate-500 bg-white rounded-2xl shadow-md">
                    <BookIcon className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">No Courses Yet</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        Get started by creating your first course and begin your teaching journey!
                    </p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary text-lg px-8 py-3">
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
