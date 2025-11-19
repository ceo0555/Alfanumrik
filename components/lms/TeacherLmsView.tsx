import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Course } from '../../types';
import { PlusIcon, BookIcon, UsersIcon, ClipboardListIcon, TrendingUpIcon } from '../../constants/icons';

const CreateCourseModal = React.lazy(() => import('./CreateCourseModal'));
const CourseEditor = React.lazy(() => import('./CourseEditor'));
const LmsAnalyticsDashboard = React.lazy(() => import('./LmsAnalyticsDashboard'));

const TeacherLmsView: React.FC = () => {
    const { activeProfile, allCourses, handleUpdateCourses } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<'courses' | 'analytics'>('courses');

    const teacherCourses = useMemo(() => {
        if (!activeProfile) return [];
        return allCourses.filter(c => c.teacherId === activeProfile.id);
    }, [allCourses, activeProfile]);

    const stats = useMemo(() => {
        const totalStudents = new Set(
            teacherCourses.flatMap(c => c.enrolledStudentIds)
        ).size;
        const totalContent = teacherCourses.reduce((sum, c) => sum + c.content.length, 0);
        const totalEnrollments = teacherCourses.reduce((sum, c) => sum + c.enrolledStudentIds.length, 0);

        return {
            totalCourses: teacherCourses.length,
            totalStudents,
            totalContent,
            totalEnrollments
        };
    }, [teacherCourses]);

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

    return (
        <div className="animate-slide-in-up">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Course Management</h1>
                        <p className="text-slate-500 text-lg">Create and manage your courses</p>
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        className="btn btn-primary flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <PlusIcon className="w-5 h-5" /> Create New Course
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            {teacherCourses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl text-white shadow-lg">
                        <BookIcon className="w-7 h-7 mb-2 opacity-90" />
                        <p className="text-3xl font-bold">{stats.totalCourses}</p>
                        <p className="text-sm opacity-90">Active Courses</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border">
                        <UsersIcon className="w-7 h-7 text-purple-600 mb-2" />
                        <p className="text-3xl font-bold text-slate-800">{stats.totalStudents}</p>
                        <p className="text-sm text-slate-500">Total Students</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border">
                        <ClipboardListIcon className="w-7 h-7 text-emerald-600 mb-2" />
                        <p className="text-3xl font-bold text-slate-800">{stats.totalContent}</p>
                        <p className="text-sm text-slate-500">Content Items</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border">
                        <TrendingUpIcon className="w-7 h-7 text-amber-600 mb-2" />
                        <p className="text-3xl font-bold text-slate-800">{stats.totalEnrollments}</p>
                        <p className="text-sm text-slate-500">Total Enrollments</p>
                    </div>
                </div>
            )}

            {teacherCourses.length > 0 && (
                <>
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
                                Course List
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
                            {teacherCourses.map(course => (
                                <div 
                                    key={course.id} 
                                    className="bg-white p-6 rounded-xl shadow-sm border hover:border-indigo-400 hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col group"
                                >
                                    {/* Course Icon */}
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <BookIcon className="w-7 h-7 text-indigo-600" />
                                    </div>

                                    <h3 className="font-bold text-xl text-slate-800 mb-2">{course.title}</h3>
                                    <p className="text-sm text-slate-500 mb-4 flex-grow line-clamp-2">{course.description}</p>
                                    
                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-indigo-600">{course.content.length}</p>
                                            <p className="text-xs text-slate-500">Items</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-purple-600">{course.enrolledStudentIds.length}</p>
                                            <p className="text-xs text-slate-500">Students</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-emerald-600">{course.grade}</p>
                                            <p className="text-xs text-slate-500">Grade</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedCourse(course)} 
                                        className="btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 w-full shadow-md"
                                    >
                                        Manage Course
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Suspense fallback={<div className="text-center p-8">Loading analytics...</div>}>
                            <LmsAnalyticsDashboard courses={allCourses} isTeacherView={true} />
                        </Suspense>
                    )}
                </>
            )}

            {teacherCourses.length === 0 && (
                <div className="text-center py-20 text-slate-500 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookIcon className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">No Courses Yet</h3>
                    <p className="font-semibold text-slate-500 mb-6 max-w-md mx-auto">
                        Start your teaching journey by creating your first course. Share your knowledge with students!
                    </p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary shadow-lg">
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
