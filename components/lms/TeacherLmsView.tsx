import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Course } from '../../types';
import { PlusIcon, BookIcon, UsersIcon, FileTextIcon, TrendingUpIcon } from '../../constants/icons';

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
            grade: activeProfile.grade || '10',
            content: [],
            enrolledStudentIds: [],
        };
        handleUpdateCourses([...allCourses, newCourse]);
        setIsCreateModalOpen(false);
    };

    if (selectedCourse) {
        return (
            <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            }>
                <CourseEditor course={selectedCourse} onBack={() => setSelectedCourse(null)} />
            </Suspense>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Course Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Create and manage your courses</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    className="btn btn-primary flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                    <PlusIcon className="w-5 h-5" /> Create New Course
                </button>
            </div>

            {teacherCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherCourses.map(course => {
                        const totalStudents = course.enrolledStudentIds.length;
                        const totalContent = course.content.length;
                        const totalAssignments = course.content.filter(i => i.type === 'quiz').length;

                        return (
                            <div 
                                key={course.id} 
                                className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 overflow-hidden"
                            >
                                {/* Course Header with Gradient */}
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg leading-tight">{course.title}</h3>
                                            <p className="text-xs text-indigo-100 mt-1">Class {course.grade}</p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                                            <span className="text-xs font-semibold">Active</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Course Body */}
                                <div className="p-5">
                                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{course.description}</p>
                                    
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <UsersIcon className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
                                            <p className="text-xs font-semibold text-slate-800">{totalStudents}</p>
                                            <p className="text-xs text-slate-500">Students</p>
                                        </div>
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <FileTextIcon className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                                            <p className="text-xs font-semibold text-slate-800">{totalContent}</p>
                                            <p className="text-xs text-slate-500">Content</p>
                                        </div>
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <TrendingUpIcon className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                                            <p className="text-xs font-semibold text-slate-800">{totalAssignments}</p>
                                            <p className="text-xs text-slate-500">Quizzes</p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button 
                                        onClick={() => setSelectedCourse(course)} 
                                        className="w-full btn bg-indigo-600 text-white hover:bg-indigo-700 group-hover:shadow-md transition-all"
                                    >
                                        Manage Course
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
                        <BookIcon className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Courses Yet</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        Start building your first course to engage students with interactive content and assessments.
                    </p>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="btn btn-primary px-6 py-3 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <PlusIcon className="w-5 h-5 inline mr-2" />
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
