import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentData } from '../../contexts/StudentDataContext';
import { Course, Assignment } from '../../types';
import { BookIcon } from '../../constants/icons';
import { View } from '../../App';

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
        <div>
            <h1 className="text-3xl font-extrabold text-slate-800 mb-6">My Courses</h1>
            
            {enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map(course => {
                        const teacher = userProfiles.find(p => p.id === course.teacherId);
                        const progress = getCourseProgress(course);
                        return (
                            <button 
                                key={course.id} 
                                onClick={() => setSelectedCourse(course)}
                                className="bg-white p-5 rounded-xl shadow-sm border hover:border-indigo-400 hover:shadow-md transition-all text-left flex flex-col"
                            >
                                <h3 className="font-bold text-lg text-slate-800">{course.title}</h3>
                                <p className="text-sm text-slate-500 mt-1 flex-grow">Taught by {teacher?.name || 'Unknown'}</p>
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold text-slate-600">Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{width: `${progress}%`}}></div>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20 text-slate-500 bg-slate-50 rounded-lg">
                    <BookIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="font-semibold text-slate-600">You are not enrolled in any courses yet.</p>
                    <p>Your teacher will enroll you in a course soon.</p>
                </div>
            )}
        </div>
    );
};

export default StudentLmsView;