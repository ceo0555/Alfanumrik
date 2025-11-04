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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-slate-800">My Courses</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary flex items-center justify-center gap-2">
                    <PlusIcon className="w-5 h-5" /> Create New Course
                </button>
            </div>

            {teacherCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherCourses.map(course => (
                        <div key={course.id} className="bg-white p-5 rounded-xl shadow-sm border flex flex-col">
                            <h3 className="font-bold text-lg text-slate-800">{course.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 flex-grow">{course.description}</p>
                            <p className="text-xs text-slate-500 mt-2">Class {course.grade} | {course.content.length} items | {course.enrolledStudentIds.length} students</p>
                            <button onClick={() => setSelectedCourse(course)} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 w-full mt-4">
                                Manage Course
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 text-slate-500 bg-slate-50 rounded-lg">
                    <BookIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="font-semibold text-slate-600">You haven't created any courses yet.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary mt-4">
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
