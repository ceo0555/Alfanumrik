import React, { useState, Suspense } from 'react';
import { Course } from '../../types';
import { ArrowLeftIcon, XIcon } from '../../constants/icons';
import { useAuth } from '../../contexts/AuthContext';
import Gradebook from './Gradebook';

const AddContentModal = React.lazy(() => import('./AddContentModal'));
const EnrollStudentModal = React.lazy(() => import('./EnrollStudentModal'));

interface CourseEditorProps {
    course: Course;
    onBack: () => void;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ course, onBack }) => {
    const { allCourses, handleUpdateCourses } = useAuth();
    const [activeTab, setActiveTab] = useState<'content' | 'students' | 'gradebook'>('content');
    const [isAddContentOpen, setIsAddContentOpen] = useState(false);
    const [isEnrollStudentOpen, setIsEnrollStudentOpen] = useState(false);
    
    const updateCourse = (updatedCourse: Course) => {
        const updatedCourses = allCourses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
        handleUpdateCourses(updatedCourses);
    };

    const handleAddContent = (contentIds: { id: string, name: string }[]) => {
        const newContent = contentIds.map(c => ({
            type: 'lesson' as 'lesson' | 'quiz', // For now, only lessons
            contentId: c.id,
            title: c.name
        }));
        
        const updatedCourse = {
            ...course,
            content: [...course.content, ...newContent.filter(nc => !course.content.some(oc => oc.contentId === nc.contentId))]
        };
        updateCourse(updatedCourse);
        setIsAddContentOpen(false);
    };
    
    const handleEnrollStudents = (studentIds: number[]) => {
        const updatedCourse = { ...course, enrolledStudentIds: studentIds };
        updateCourse(updatedCourse);
        setIsEnrollStudentOpen(false);
    };

    const handleRemoveContent = (contentIdToRemove: string) => {
        if (window.confirm("Are you sure you want to remove this content item from the course?")) {
            const updatedCourse = {
                ...course,
                content: course.content.filter(c => c.contentId !== contentIdToRemove)
            };
            updateCourse(updatedCourse);
        }
    };

    return (
        <div>
            <button onClick={onBack} className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 mb-4 flex items-center gap-2">
                <ArrowLeftIcon className="w-4 h-4"/> Back to Courses
            </button>
            <h1 className="text-3xl font-extrabold text-slate-800">{course.title}</h1>
            <p className="text-slate-500 mt-1">{course.description}</p>
            
            <div className="border-b mt-6 mb-4">
                <div className="flex gap-4">
                    <button onClick={() => setActiveTab('content')} className={`py-2 font-semibold border-b-2 ${activeTab === 'content' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>Content</button>
                    <button onClick={() => setActiveTab('students')} className={`py-2 font-semibold border-b-2 ${activeTab === 'students' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>Students</button>
                    <button onClick={() => setActiveTab('gradebook')} className={`py-2 font-semibold border-b-2 ${activeTab === 'gradebook' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}>Gradebook</button>
                </div>
            </div>

            {activeTab === 'content' && (
                <div>
                    <button onClick={() => setIsAddContentOpen(true)} className="btn btn-primary mb-4">Add Content</button>
                    <div className="space-y-2">
                        {course.content.map(item => (
                            <div key={item.contentId} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center">
                                <span>{item.title}</span>
                                <button
                                    onClick={() => handleRemoveContent(item.contentId)}
                                    className="p-1 rounded-full hover:bg-red-100 text-red-500"
                                    aria-label={`Remove ${item.title}`}
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'students' && (
                 <div>
                    <button onClick={() => setIsEnrollStudentOpen(true)} className="btn btn-primary mb-4">Manage Enrollment</button>
                    <p>{course.enrolledStudentIds.length} students enrolled.</p>
                </div>
            )}
            
            {activeTab === 'gradebook' && (
                <Gradebook course={course} />
            )}
            
            {isAddContentOpen && (
                <Suspense>
                    <AddContentModal 
                        isOpen={isAddContentOpen}
                        onClose={() => setIsAddContentOpen(false)}
                        courseGrade={course.grade}
                        onAddContent={handleAddContent}
                    />
                </Suspense>
            )}
            
            {isEnrollStudentOpen && (
                <Suspense>
                    <EnrollStudentModal
                        isOpen={isEnrollStudentOpen}
                        onClose={() => setIsEnrollStudentOpen(false)}
                        course={course}
                        onSave={handleEnrollStudents}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default CourseEditor;